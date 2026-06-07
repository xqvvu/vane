import "@tanstack/react-start/server-only";
import type {
  DeliveryJob,
  DeliveryState,
  EventRecord,
  NormalizedEvent,
  SourceSummary,
} from "@vane/core";

import { rowAs } from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  deliveryFromRow,
  type DeliveryRow,
  type SqliteDeliveryRepository,
} from "#/infra/sqlite/deliveries.ts";
import { type SqliteIntakeRepository } from "#/infra/sqlite/intake.ts";
import {
  requireSource,
  sourceSummaryFromRuntime,
  type SourceRepository,
} from "#/infra/sqlite/sources.ts";
import type { IsoDateTimeString, Page } from "#/infra/sqlite/types.ts";

export interface HistoryRepository {
  listEvents(query?: EventListQuery): Page<EventListItem>;
  getEventDetail(eventId: string): EventDetail | null;
  listDeliveries(query?: DeliveryListQuery): Page<DeliveryListItem>;
}

export interface EventListQuery {
  sourceId?: string;
  severity?: NormalizedEvent["severity"];
  status?: NormalizedEvent["status"];
  q?: string;
  cursor?: string;
  limit?: number;
}

export interface DeliveryListQuery {
  sourceId?: string;
  destinationId?: string;
  state?: DeliveryState;
  cursor?: string;
  limit?: number;
}

export interface EventListItem {
  id: string;
  sourceId: string;
  sourceName: string;
  severity: NormalizedEvent["severity"];
  status: NormalizedEvent["status"];
  title: string;
  fingerprint: string;
  receivedAt: IsoDateTimeString;
  deliveryCounts: Record<DeliveryState, number>;
}

export interface EventDetail {
  event: EventRecord;
  source: SourceSummary;
  deliveries: DeliveryJob[];
}

export interface DeliveryListItem {
  id: string;
  eventId: string;
  sourceName: string;
  destinationName: string;
  routeName: string | null;
  state: DeliveryState;
  attemptCount: number;
  nextAttemptAt: IsoDateTimeString | null;
  lastError: string | null;
  updatedAt: IsoDateTimeString;
}

export class SqliteHistoryRepository implements HistoryRepository {
  constructor(
    private readonly context: SqliteRepositoryContext,
    private readonly sources: SourceRepository,
    private readonly intake: SqliteIntakeRepository,
    _deliveries: SqliteDeliveryRepository,
  ) {}

  listEvents(query: EventListQuery = {}): Page<EventListItem> {
    const limit = query.limit ?? 50;
    const filters: string[] = [];
    const params: Array<string | number> = [];

    if (query.sourceId) {
      filters.push("events.source_id = ?");
      params.push(query.sourceId);
    }

    if (query.severity) {
      filters.push("events.severity = ?");
      params.push(query.severity);
    }

    if (query.status) {
      filters.push("events.status = ?");
      params.push(query.status);
    }

    if (query.q) {
      filters.push("(events.title LIKE ? OR events.message LIKE ?)");
      params.push(`%${query.q}%`, `%${query.q}%`);
    }

    if (query.cursor) {
      filters.push("events.received_at < ?");
      params.push(query.cursor);
    }

    const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    const rows = this.context.db
      .prepare(
        `
          SELECT
            events.id,
            events.source_id,
            sources.name AS source_name,
            events.severity,
            events.status,
            events.title,
            events.fingerprint,
            events.received_at,
            SUM(CASE WHEN deliveries.state = 'pending' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN deliveries.state = 'running' THEN 1 ELSE 0 END) AS running_count,
            SUM(CASE WHEN deliveries.state = 'succeeded' THEN 1 ELSE 0 END) AS succeeded_count,
            SUM(CASE WHEN deliveries.state = 'failed' THEN 1 ELSE 0 END) AS failed_count
          FROM events
          JOIN sources ON sources.id = events.source_id
          LEFT JOIN deliveries ON deliveries.event_id = events.id
          ${where}
          GROUP BY events.id
          ORDER BY events.received_at DESC
          LIMIT ?
        `,
      )
      .all(...params, limit + 1) as Array<{
      id: string;
      source_id: string;
      source_name: string;
      severity: EventListItem["severity"];
      status: EventListItem["status"];
      title: string;
      fingerprint: string;
      received_at: string;
      pending_count: number | null;
      running_count: number | null;
      succeeded_count: number | null;
      failed_count: number | null;
    }>;
    const pageRows = rows.slice(0, limit);

    return {
      items: pageRows.map((row) => ({
        id: row.id,
        sourceId: row.source_id,
        sourceName: row.source_name,
        severity: row.severity,
        status: row.status,
        title: row.title,
        fingerprint: row.fingerprint,
        receivedAt: row.received_at,
        deliveryCounts: {
          pending: row.pending_count ?? 0,
          running: row.running_count ?? 0,
          succeeded: row.succeeded_count ?? 0,
          failed: row.failed_count ?? 0,
        },
      })),
      nextCursor: rows.length > limit ? (pageRows.at(-1)?.received_at ?? null) : null,
    };
  }

  getEventDetail(eventId: string): EventDetail | null {
    const event = this.intake.get(eventId);

    if (!event) {
      return null;
    }

    const source = sourceSummaryFromRuntime(requireSource(this.sources.get(event.sourceId)));
    const deliveries = this.context.db
      .prepare("SELECT * FROM deliveries WHERE event_id = ? ORDER BY created_at")
      .all(eventId)
      .map((row) => deliveryFromRow(rowAs<DeliveryRow>(row)));

    return { event, source, deliveries };
  }

  listDeliveries(query: DeliveryListQuery = {}): Page<DeliveryListItem> {
    const limit = query.limit ?? 50;
    const filters: string[] = [];
    const params: Array<string | number> = [];

    if (query.sourceId) {
      filters.push("events.source_id = ?");
      params.push(query.sourceId);
    }

    if (query.destinationId) {
      filters.push("deliveries.destination_id = ?");
      params.push(query.destinationId);
    }

    if (query.state) {
      filters.push("deliveries.state = ?");
      params.push(query.state);
    }

    if (query.cursor) {
      filters.push("deliveries.updated_at < ?");
      params.push(query.cursor);
    }

    const where = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    const rows = this.context.db
      .prepare(
        `
          SELECT
            deliveries.id,
            deliveries.event_id,
            sources.name AS source_name,
            destinations.name AS destination_name,
            routes.name AS route_name,
            deliveries.state,
            deliveries.attempt_count,
            deliveries.next_attempt_at,
            deliveries.last_error,
            deliveries.updated_at
          FROM deliveries
          JOIN events ON events.id = deliveries.event_id
          JOIN sources ON sources.id = events.source_id
          JOIN destinations ON destinations.id = deliveries.destination_id
          LEFT JOIN routes ON routes.id = deliveries.route_id
          ${where}
          ORDER BY deliveries.updated_at DESC
          LIMIT ?
        `,
      )
      .all(...params, limit + 1) as Array<{
      id: string;
      event_id: string;
      source_name: string;
      destination_name: string;
      route_name: string | null;
      state: DeliveryListItem["state"];
      attempt_count: number;
      next_attempt_at: string | null;
      last_error: string | null;
      updated_at: string;
    }>;
    const pageRows = rows.slice(0, limit);

    return {
      items: pageRows.map((row) => ({
        id: row.id,
        eventId: row.event_id,
        sourceName: row.source_name,
        destinationName: row.destination_name,
        routeName: row.route_name,
        state: row.state,
        attemptCount: row.attempt_count,
        nextAttemptAt: row.next_attempt_at,
        lastError: row.last_error,
        updatedAt: row.updated_at,
      })),
      nextCursor: rows.length > limit ? (pageRows.at(-1)?.updated_at ?? null) : null,
    };
  }
}
