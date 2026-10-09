import type { UrgencyChannelKind } from "@vane/destinations";
import { FeishuConfigSchema } from "@vane/destinations/feishu";

import type {
  OncallPingTriggerInput,
  OncallServiceOptions,
} from "#/server/oncall/oncall.service.types";

const DEFAULT_DEDUPE_WINDOW_MS = 5 * 60_000;
const URGENT_CHANNEL: UrgencyChannelKind = "feishu_urgent_phone";

/**
 * Automatic urgent paging.
 *
 * The trigger is deliberately narrow: only a succeeded app-mode Feishu
 * delivery of a firing alert whose severity passes the destination's urgent
 * gate creates pings. Pings are per receiver and deduplicated per
 * fingerprint + destination + receiver, so an alert storm cannot become a
 * call storm. Every other delivery, including webhook-mode sends, enqueues
 * nothing.
 */
export class OncallService {
  private readonly store: OncallServiceOptions["store"];
  private readonly dedupeWindowMs: number;
  private readonly now: () => string;

  constructor(options: OncallServiceOptions) {
    this.store = options.store;
    this.dedupeWindowMs = options.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async triggerPingsForDelivery(input: OncallPingTriggerInput): Promise<void> {
    const { destination, event } = input.delivery;

    if (destination.kind !== "feishu") {
      return;
    }

    const parsed = FeishuConfigSchema.safeParse(destination.config);

    if (!parsed.success) {
      return;
    }

    const { sendMode, urgent } = parsed.data;
    const now = input.now ?? this.now();

    if (sendMode !== "app" || !urgent?.autoEnabled) {
      return;
    }

    if (event.normalized.status !== "firing") {
      return;
    }

    if (
      urgent.severities.length > 0 &&
      !urgent.severities.some((severity) => severity === event.normalized.severity)
    ) {
      return;
    }

    const dedupeWindowStartsAt = new Date(
      new Date(now).valueOf() - this.dedupeWindowMs,
    ).toISOString();

    for (const receiver of urgent.receivers) {
      await this.store.oncall.enqueueForDelivery({
        deliveryId: input.delivery.job.id,
        destinationId: destination.id,
        eventId: event.id,
        fingerprint: event.normalized.fingerprint,
        receiver,
        channel: URGENT_CHANNEL,
        providerReference: input.providerReference,
        trigger: "auto",
        dedupeWindowStartsAt,
        now,
      });
    }
  }
}
