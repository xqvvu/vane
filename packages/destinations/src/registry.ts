import type { DestinationKind } from "@vane/core";

import { genericWebhookSender } from "#/generic-webhook.ts";
import type { DestinationSendContext, DestinationSendInput, DestinationSendResult, DestinationSender } from "#/types.ts";

export class DestinationRegistry {
  private readonly senders = new Map<DestinationKind, DestinationSender>();

  register(sender: DestinationSender): void {
    if (this.senders.has(sender.kind)) {
      throw new Error(`Destination sender already registered: ${sender.kind}`);
    }

    this.senders.set(sender.kind, sender);
  }

  get(kind: DestinationKind): DestinationSender {
    const sender = this.senders.get(kind);

    if (!sender) {
      throw new Error(`Unknown destination sender: ${kind}`);
    }

    return sender;
  }

  send(kind: DestinationKind, input: DestinationSendInput<unknown>, context?: DestinationSendContext) {
    return this.get(kind).send(input, context);
  }

  list(): DestinationSender[] {
    return [...this.senders.values()];
  }
}

export function createDefaultDestinationRegistry(): DestinationRegistry {
  const registry = new DestinationRegistry();
  registry.register(genericWebhookSender);
  return registry;
}

export type { DestinationSendContext, DestinationSendInput, DestinationSendResult, DestinationSender };
