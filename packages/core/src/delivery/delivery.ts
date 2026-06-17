import { z } from "zod";

import { IsoDateTimeSchema } from "#/event/normalized-event.ts";

export const DeliveryStateSchema = z.enum(["pending", "running", "succeeded", "failed"]);
export type DeliveryState = z.infer<typeof DeliveryStateSchema>;

export const DeliveryJobSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  destinationId: z.string().min(1),
  routeId: z.string().min(1).nullable(),
  state: DeliveryStateSchema,
  attemptCount: z.number().int().min(0),
  maxAttempts: z.number().int().min(1),
  nextAttemptAt: IsoDateTimeSchema.nullable(),
  lastError: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  finishedAt: IsoDateTimeSchema.nullable(),
});

export type DeliveryJob = z.infer<typeof DeliveryJobSchema>;
