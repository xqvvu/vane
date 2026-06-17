import "@tanstack/react-start/server-only";
import { redactText } from "@vane/core";
import type {
  DestinationRetryHint,
  DestinationSendContext,
  DestinationRegistry,
} from "@vane/destinations";

import type { ClaimedDelivery, DeliveryRepository } from "#/infra/sqlite/deliveries.ts";

export interface DeliveryExecutionStore {
  readonly deliveries: Pick<DeliveryRepository, "markSucceeded" | "markFailed">;
}

export interface DeliveryExecutionOptions {
  store: DeliveryExecutionStore;
  destinations: Pick<DestinationRegistry, "send">;
  sendContext?: DestinationSendContext;
  backoff?: DeliveryBackoffOptions;
}

export interface DeliveryBackoffOptions {
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export type DeliveryExecutionOutcome = "succeeded" | "retrying" | "failed";

export class DeliveryExecution {
  private readonly store: DeliveryExecutionStore;
  private readonly destinations: Pick<DestinationRegistry, "send">;
  private readonly sendContext?: DestinationSendContext;
  private readonly initialDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(options: DeliveryExecutionOptions) {
    this.store = options.store;
    this.destinations = options.destinations;
    this.sendContext = options.sendContext;
    this.initialDelayMs = options.backoff?.initialDelayMs ?? 30_000;
    this.maxDelayMs = options.backoff?.maxDelayMs ?? 15 * 60_000;
  }

  async execute(delivery: ClaimedDelivery, now: string): Promise<DeliveryExecutionOutcome> {
    try {
      const sendResult = await this.destinations.send(
        delivery.destination.kind,
        {
          eventId: delivery.event.id,
          source: delivery.source,
          destination: delivery.destination,
          normalizedEvent: delivery.event.normalized,
          config: delivery.destination.config,
        },
        this.sendContext,
      );

      if (sendResult.ok) {
        this.store.deliveries.markSucceeded({
          deliveryId: delivery.job.id,
          attemptId: delivery.attempt.id,
          renderedPayload: sendResult.renderedPayload,
          responseStatus: sendResult.statusCode ?? undefined,
          responseBody: redactOptionalText(sendResult.responseBody),
          finishedAt: now,
        });

        return "succeeded";
      }

      return this.markFailed(delivery, {
        error: sendResult.errorMessage,
        responseStatus: sendResult.statusCode ?? undefined,
        responseBody: redactOptionalText(sendResult.responseBody),
        retryHint: sendResult.retryHint,
        finishedAt: now,
      });
    } catch (error) {
      return this.markFailed(delivery, {
        error: redactText(error instanceof Error ? error.message : String(error)),
        finishedAt: now,
      });
    }
  }

  private markFailed(
    delivery: ClaimedDelivery,
    input: {
      error: string;
      retryHint?: DestinationRetryHint;
      responseStatus?: number;
      responseBody?: string;
      finishedAt: string;
    },
  ): "retrying" | "failed" {
    const retryAt = this.nextRetryAt(delivery, input.finishedAt, input.retryHint);
    const updated = this.store.deliveries.markFailed({
      deliveryId: delivery.job.id,
      attemptId: delivery.attempt.id,
      error: redactText(input.error),
      retryAt,
      responseStatus: input.responseStatus,
      responseBody: redactOptionalText(input.responseBody),
      finishedAt: input.finishedAt,
    });

    return updated.state === "pending" ? "retrying" : "failed";
  }

  private nextRetryAt(
    delivery: ClaimedDelivery,
    now: string,
    retryHint: DestinationRetryHint = "retryable",
  ): string | null {
    if (retryHint === "not_retryable") {
      return null;
    }

    if (delivery.job.attemptCount >= delivery.job.maxAttempts) {
      return null;
    }

    const delay = Math.min(
      this.initialDelayMs * 2 ** Math.max(0, delivery.job.attemptCount - 1),
      this.maxDelayMs,
    );

    return new Date(new Date(now).valueOf() + delay).toISOString();
  }
}

function redactOptionalText(value: string | null | undefined): string | undefined {
  return value === null || value === undefined ? undefined : redactText(value);
}
