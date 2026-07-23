import { z } from "zod";

import type { DeliveryJob, DeliveryState } from "#core/delivery/delivery";
import type { DestinationSummary } from "#core/destination/destination";
import type { EventRecord } from "#core/event/event";
import type { JsonObject, JsonValue } from "#core/json";
import type { NormalizedEvent } from "#core/event/normalized-event";
import type { RouteDefinition, RouteMatchResult } from "#core/route/route";
import type { SourceSummary } from "#core/source/source";

export type IsoDateTimeString = string;

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface NumberedPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Operations {
  events: NumberedPage<EventListItem>;
  deliveries: Page<DeliveryListItem>;
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
  routeMatchCount: number;
  deliveryCounts: Record<DeliveryState, number>;
}

export interface EventDetail {
  event: EventRecord;
  source: SourceSummary;
  routeMatches: RouteMatchResult[];
  deliveries: EventDetailDelivery[];
}

export interface EventDetailDelivery extends DeliveryJob {
  destinationName: string;
  routeName: string | null;
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

export interface DeliveryAttempt {
  id: string;
  deliveryId: string;
  attemptNumber: number;
  state: "running" | "succeeded" | "failed";
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  startedAt: IsoDateTimeString;
  finishedAt: IsoDateTimeString | null;
}

export interface DeliveryDetail {
  job: DeliveryJob;
  event: EventRecord;
  source: SourceSummary;
  destination: DestinationSummary;
  destinationMetadata: JsonObject;
  route: RouteDefinition | null;
  renderedPayload: JsonValue | null;
  attempts: DeliveryAttempt[];
}

export interface WorkerRunNotice {
  claimed: number;
  reclaimed: number;
  succeeded: number;
  failed: number;
  retrying: number;
  startedAt: IsoDateTimeString;
  finishedAt: IsoDateTimeString;
  health?: WorkerHealthSnapshot;
  runnerHealth?: WorkerHealthSnapshot;
}

export interface WorkerHealthSnapshot {
  state: "idle" | "running" | "failed";
  lastStartedAt: IsoDateTimeString | null;
  lastFinishedAt: IsoDateTimeString | null;
  lastError: string | null;
  lastRun: Omit<WorkerRunNotice, "health" | "runnerHealth"> | null;
}

export const ReplayEventCommandSchema = z.object({
  eventId: z.string().min(1),
});
export type ReplayEventCommand = z.infer<typeof ReplayEventCommandSchema>;

export const PreviewRouteReplayCommandSchema = z.object({
  routeId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type PreviewRouteReplayCommand = z.infer<typeof PreviewRouteReplayCommandSchema>;

export const ReplayRouteEventsCommandSchema = z.object({
  routeId: z.string().min(1),
  eventIds: z.array(z.string().min(1)).min(1).max(100),
});
export type ReplayRouteEventsCommand = z.infer<typeof ReplayRouteEventsCommandSchema>;

export interface EventReplayTarget {
  routeId: string;
  routeName: string;
  destinationId: string;
  deliveryId: string | null;
  alreadyExists: boolean;
}

export interface EventReplayPreview {
  eventId: string;
  routeMatches: RouteMatchResult[];
  targets: EventReplayTarget[];
  matchedRouteCount: number;
  newDeliveryCount: number;
  existingDeliveryCount: number;
}

export interface EventReplayResult extends EventReplayPreview {
  createdDeliveryIds: string[];
  skippedExistingCount: number;
}

export interface RouteReplayEventSummary {
  id: string;
  sourceId: string;
  sourceName: string;
  severity: NormalizedEvent["severity"];
  status: NormalizedEvent["status"];
  title: string;
  fingerprint: string;
  receivedAt: IsoDateTimeString;
}

export interface RouteReplayCandidate {
  event: RouteReplayEventSummary;
  targets: EventReplayTarget[];
  newDeliveryCount: number;
  existingDeliveryCount: number;
}

export interface RouteReplayPreview {
  routeId: string;
  routeName: string;
  enabled: boolean;
  limit: number;
  scannedEventCount: number;
  matchedEventCount: number;
  candidates: RouteReplayCandidate[];
  newDeliveryCount: number;
  existingDeliveryCount: number;
}

export interface RouteReplayResult {
  routeId: string;
  routeName: string;
  enabled: boolean;
  eventCount: number;
  createdDeliveryIds: string[];
  skippedExistingCount: number;
}
