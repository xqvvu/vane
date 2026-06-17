import type {
  DeliveryJob,
  DeliveryState,
  DestinationSummary,
  EventRecord,
  JsonObject,
  JsonValue,
  NormalizedEvent,
  RouteDefinition,
  RouteMatchResult,
  SourceSummary,
} from "@vane/core";

type IsoDateTimeString = string;

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface Operations {
  events: Page<EventListItem>;
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
