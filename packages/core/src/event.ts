import { z } from "zod";

import { JsonObjectSchema, JsonValueSchema } from "#/json.ts";
import { IsoDateTimeSchema, NormalizedEventSchema } from "#/normalized-event.ts";

export const EventRecordSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  idempotencyKey: z.string().min(1).nullable(),
  normalized: NormalizedEventSchema,
  providerMetadata: JsonObjectSchema.default({}),
  rawPayload: JsonValueSchema,
  rawHeaders: z.record(z.string(), z.string()).default({}),
  receivedAt: IsoDateTimeSchema,
});

export type EventRecord = z.infer<typeof EventRecordSchema>;
