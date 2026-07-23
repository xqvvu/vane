import { parseAlertmanagerCompatibleProvider } from "#providers/shared/alertmanager-compatible";
import {
  type ProviderParseInput,
  type ProviderParseOutput,
  type ProviderStandaloneParseInput,
} from "#providers/types";
import { ParseInput, ParseResult } from "#providers/utils";

import type { SignozProviderConfig } from "#providers/signoz/schema";

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
