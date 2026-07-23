import { z } from "zod";

import { JsonObjectSchema, JsonValueSchema } from "#core/json";
import { IsoDateTimeSchema, NormalizedEventSchema } from "#core/event/normalized-event";
import { RouteMatchResultsSchema } from "#core/route/route";

export const EventRecordSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  idempotencyKey: z.string().min(1).nullable(),
  normalized: NormalizedEventSchema,
  providerMetadata: JsonObjectSchema.default({}),
  rawPayload: JsonValueSchema,
  rawHeaders: z.record(z.string(), z.string()).default({}),
  routeMatches: RouteMatchResultsSchema.nullable().default(null),
  receivedAt: IsoDateTimeSchema,
});

export type EventRecord = z.infer<typeof EventRecordSchema>;
