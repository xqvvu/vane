import type { SourceProvider } from "@vane/core";

import { alertmanagerProviderParser } from "#/alertmanager.ts";
import { grafanaProviderParser } from "#/grafana.ts";
import { genericProviderParser } from "#/generic.ts";
import { signozProviderParser } from "#/signoz.ts";
import type { ProviderParseInput, ProviderParseResult, ProviderParser } from "#/types.ts";
import { uptimeKumaProviderParser } from "#/uptime-kuma.ts";

export class ProviderRegistry {
  private readonly parsers = new Map<SourceProvider, ProviderParser>();

  register(parser: ProviderParser): void {
    if (this.parsers.has(parser.kind)) {
      throw new Error(`Provider parser already registered: ${parser.kind}`);
    }

    this.parsers.set(parser.kind, parser);
  }

  get(kind: SourceProvider): ProviderParser {
    const parser = this.parsers.get(kind);

    if (!parser) {
      throw new Error(`Unknown provider parser: ${kind}`);
    }

    return parser;
  }

  parse(kind: SourceProvider, input: ProviderParseInput): ProviderParseResult {
    return this.get(kind).parse(input);
  }

  list(): ProviderParser[] {
    return [...this.parsers.values()];
  }
}

export function createDefaultProviderRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();
  registry.register(genericProviderParser);
  registry.register(signozProviderParser);
  registry.register(grafanaProviderParser);
  registry.register(uptimeKumaProviderParser);
  registry.register(alertmanagerProviderParser);
  return registry;
}
