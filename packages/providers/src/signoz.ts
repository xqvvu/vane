import type { ProviderParseInput, ProviderParseResult, ProviderParser } from "#/types.ts";
import { parseAlertmanagerCompatibleProvider } from "#/alertmanager.ts";

export const signozProviderParser: ProviderParser = {
  kind: "signoz",
  parse(input) {
    return parseSignozProvider(input);
  },
};

export function parseSignozProvider(input: ProviderParseInput): ProviderParseResult {
  return parseAlertmanagerCompatibleProvider(input, {
    provider: "signoz",
    defaultTitle: "SigNoz alert",
  });
}
