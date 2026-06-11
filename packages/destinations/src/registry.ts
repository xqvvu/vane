import type { DestinationKind } from "@vane/core";

import { emailSender } from "#/email.ts";
import { feishuSender } from "#/feishu.ts";
import { genericWebhookSender } from "#/generic-webhook.ts";
import { slackSender } from "#/slack.ts";
import type {
  DestinationSendContext,
  DestinationSendInput,
  DestinationSendResult,
  DestinationSender,
} from "#/types.ts";

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

  send(
    kind: DestinationKind,
    input: DestinationSendInput<unknown>,
    context?: DestinationSendContext,
  ) {
    return this.get(kind).send(input, context);
  }

  preview(kind: DestinationKind, input: DestinationSendInput<unknown>) {
    return this.get(kind).preview(input);
  }

  list(): DestinationSender[] {
    return [...this.senders.values()];
  }
}

export function createDefaultDestinationRegistry(): DestinationRegistry {
  const registry = new DestinationRegistry();
  registry.register(genericWebhookSender);
  registry.register(feishuSender);
  registry.register(slackSender);
  registry.register(emailSender);
  return registry;
}

export type {
  DestinationSendContext,
  DestinationSendInput,
  DestinationSendResult,
  DestinationSender,
};
