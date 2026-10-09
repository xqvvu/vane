import { z } from "zod";

import { ProviderReferenceSchema } from "#core/delivery/delivery";

/**
 * Paging lifecycle. `scheduled` and `suppressed` are reserved for delayed
 * escalation and acknowledgement; the immediate slice only produces
 * `running` / `fired` / `failed`.
 */
export const OncallPingStateSchema = z.enum([
  "scheduled",
  "running",
  "fired",
  "suppressed",
  "failed",
]);
export type OncallPingState = z.output<typeof OncallPingStateSchema>;

export const OncallPingTriggerSchema = z.enum(["auto", "manual"]);
export type OncallPingTrigger = z.output<typeof OncallPingTriggerSchema>;

/**
 * One urgent phone call attempt towards a single receiver.
 *
 * A ping belongs to the delivery whose message it acts on: `providerReference`
 * is the message handle captured from that delivery's app send. Pings are
 * per-receiver so one failed call neither blocks nor retries the others.
 */
export const OncallPingSchema = z.object({
  id: z.string().min(1),
  deliveryId: z.string().min(1),
  destinationId: z.string().min(1),
  eventId: z.string().min(1),
  /** Feishu user id the call targets. */
  receiver: z.string().min(1),
  /** Urgency channel kind, e.g. `feishu_urgent_phone`. */
  channel: z.string().min(1),
  state: OncallPingStateSchema,
  trigger: OncallPingTriggerSchema,
  /** Dashboard user who triggered a manual page; null for automatic pages. */
  initiatedBy: z.string().nullable(),
  /** The message this ping urgent-calls, captured from the delivery. */
  providerReference: ProviderReferenceSchema.nullable(),
  attemptCount: z.number().int().min(0),
  maxAttempts: z.number().int().min(1),
  /** When the next retry is due; null while queued or after a terminal state. */
  nextAttemptAt: z.string().nullable(),
  lastError: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  firedAt: z.string().nullable(),
});
export type OncallPing = z.output<typeof OncallPingSchema>;
