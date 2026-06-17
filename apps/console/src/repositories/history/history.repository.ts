import type { DeliveryListItem, EventDetail, EventListItem } from "@vane/core";
import { evaluateRouteMatch } from "@vane/core";

import { rowAs } from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import type { Page } from "#/infra/sqlite/types.ts";
import type { SqliteDeliveryRepository } from "#/repositories/delivery/delivery.repository.ts";
import {
  decodeHistoryCursor,
  encodeHistoryCursor,
  eventDetailDeliveryFromRow,
  type EventDetailDeliveryRow,
} from "#/repositories/history/history.helpers.ts";
import type {
  DeliveryListQuery,
  EventListQuery,
  HistoryRepository,
} from "#/repositories/history/history.interface.ts";
import type { SqliteIntakeRepository } from "#/repositories/intake/intake.repository.ts";
import type { RouteRepository } from "#/repositories/route/route.interface.ts";
import { requireSource, sourceSummaryFromRuntime } from "#/repositories/source/source.helpers.ts";
import type { SourceRepository } from "#/repositories/source/source.interface.ts";

export class SqliteHistoryRepository implements HistoryRepository {
  constructor(
    private readonly context: SqliteRepositoryContext,
    private readonly sources: SourceRepository,
    private readonly intake: SqliteIntakeRepository,
    private readonly routes: RouteRepository,
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
      const cursor = decodeHistoryCursor(query.cursor);

      if (cursor.id) {
        filters.push("(events.received_at < ? OR (events.received_at = ? AND events.id < ?))");
        params.push(cursor.time, cursor.time, cursor.id);
      } else {
        filters.push("events.received_at < ?");
        params.push(cursor.time);
      }
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
          ORDER BY events.received_at DESC, events.id DESC
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
      nextCursor:
        rows.length > limit && pageRows.at(-1)
          ? encodeHistoryCursor(pageRows.at(-1)!.received_at, pageRows.at(-1)!.id)
          : null,
    };
  }

  getEventDetail(eventId: string): EventDetail | null {
    const event = this.intake.get(eventId);

    if (!event) {
      return null;
    }

    const source = sourceSummaryFromRuntime(requireSource(this.sources.get(event.sourceId)));
    const routeMatches =
      event.routeMatches ??
      this.routes.list().map((route) =>
        evaluateRouteMatch(route, {
          sourceId: event.sourceId,
          event: event.normalized,
        }),
      );
    const deliveries = this.context.db
      .prepare(
        `
          SELECT
            deliveries.*,
            destinations.name AS destination_name,
            routes.name AS route_name
          FROM deliveries
          JOIN destinations ON destinations.id = deliveries.destination_id
          LEFT JOIN routes ON routes.id = deliveries.route_id
          WHERE deliveries.event_id = ?
          ORDER BY deliveries.created_at
        `,
      )
      .all(eventId)
      .map((row) => eventDetailDeliveryFromRow(rowAs<EventDetailDeliveryRow>(row)));

    return { event, source, routeMatches, deliveries };
  }

  listDeliveries(query: DeliveryListQuery = {}): Page<DeliveryListItem> {
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

    if (query.destinationId) {
      filters.push("deliveries.destination_id = ?");
      params.push(query.destinationId);
    }

    if (query.state) {
      filters.push("deliveries.state = ?");
      params.push(query.state);
    }

    if (query.q) {
      filters.push("(events.title LIKE ? OR events.message LIKE ?)");
      params.push(`%${query.q}%`, `%${query.q}%`);
    }

    if (query.cursor) {
      const cursor = decodeHistoryCursor(query.cursor);

      if (cursor.id) {
        filters.push(
          "(deliveries.updated_at < ? OR (deliveries.updated_at = ? AND deliveries.id < ?))",
        );
        params.push(cursor.time, cursor.time, cursor.id);
      } else {
        filters.push("deliveries.updated_at < ?");
        params.push(cursor.time);
      }
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
          ORDER BY deliveries.updated_at DESC, deliveries.id DESC
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
      nextCursor:
        rows.length > limit && pageRows.at(-1)
          ? encodeHistoryCursor(pageRows.at(-1)!.updated_at, pageRows.at(-1)!.id)
          : null,
    };
  }
}
