import { parseAlertmanagerCompatibleProvider } from "#/shared/alertmanager-compatible.ts";
import {
  type ProviderParseInput,
  type ProviderParseOutput,
  type ProviderStandaloneParseInput,
} from "#/types.ts";
import { ParseInput, ParseResult } from "#/utils.ts";

import type { SignozProviderConfig } from "#/signoz/schema.ts";

export function parseSignozProviderResult(input: ProviderParseInput<SignozProviderConfig>) {
  return ParseResult.ok(
    parseAlertmanagerCompatibleProvider(input, {
      provider: "signoz",
      defaultTitle: "SigNoz alert",
    }),
  );
}

export function parseSignozProvider(
  input: ProviderStandaloneParseInput<SignozProviderConfig>,
): ProviderParseOutput {
  return ParseResult.unwrap(
    parseSignozProviderResult(ParseInput.fromStandalone("signoz", input, input.config ?? {})),
  );
}
