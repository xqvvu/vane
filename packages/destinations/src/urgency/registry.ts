import type { DestinationTransportContext } from "#destinations/types";
import { createFeishuUrgentPhoneAdapter } from "#destinations/urgency/feishu-urgent/index";
import {
  UrgencyChannelKindSchema,
  type UrgencyChannelAdapter,
  type UrgencyChannelKind,
  type UrgencyPingInput,
  type UrgencyPingResult,
} from "#destinations/urgency/types";

export class UrgencyRegistry {
  private readonly adapters = new Map<UrgencyChannelKind, UrgencyChannelAdapter>();

  register(adapter: UrgencyChannelAdapter): void {
    const kind = UrgencyChannelKindSchema.parse(adapter.kind);

    if (this.adapters.has(kind)) {
      throw new Error(`Urgency channel already registered: ${kind}`);
    }

    this.adapters.set(kind, adapter);
  }

  get(kind: UrgencyChannelKind): UrgencyChannelAdapter {
    const adapter = this.adapters.get(kind);

    if (!adapter) {
      throw new Error(`Unknown urgency channel: ${kind}`);
    }

    return adapter;
  }

  ping(
    kind: UrgencyChannelKind,
    input: UrgencyPingInput,
    context?: DestinationTransportContext,
  ): Promise<UrgencyPingResult> {
    return this.get(kind).ping(input, context);
  }

  get list(): UrgencyChannelAdapter[] {
    return [...this.adapters.values()];
  }
}

export function createDefaultUrgencyRegistry(): UrgencyRegistry {
  const registry = new UrgencyRegistry();

  registry.register(createFeishuUrgentPhoneAdapter());

  return registry;
}
