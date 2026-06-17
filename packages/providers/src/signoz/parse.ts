import { parseAlertmanagerCompatibleProvider } from "#/shared/alertmanager-compatible.ts";
import {
  completeProviderParseInput,
  providerParseSucceeded,
  type ProviderParseInput,
  type ProviderParseOutput,
  type ProviderStandaloneParseInput,
  unwrapProviderParseResult,
} from "#/types.ts";

import type { SignozProviderConfig } from "./schema.ts";

export function parseSignozProviderResult(input: ProviderParseInput<SignozProviderConfig>) {
  return providerParseSucceeded(
    parseAlertmanagerCompatibleProvider(input, {
      provider: "signoz",
      defaultTitle: "SigNoz alert",
    }),
  );
}

export function parseSignozProvider(
  input: ProviderStandaloneParseInput<SignozProviderConfig>,
): ProviderParseOutput {
  return unwrapProviderParseResult(
    parseSignozProviderResult(completeProviderParseInput("signoz", input, input.config ?? {})),
  );
}
