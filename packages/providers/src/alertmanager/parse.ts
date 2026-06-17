import { parseAlertmanagerCompatibleProvider } from "#/shared/alertmanager-compatible.ts";
import {
  completeProviderParseInput,
  type ProviderParseInput,
  type ProviderParseOutput,
  type ProviderStandaloneParseInput,
  providerParseSucceeded,
  unwrapProviderParseResult,
} from "#/types.ts";

import type { AlertmanagerProviderConfig } from "./schema.ts";

export function parseAlertmanagerProviderResult(
  input: ProviderParseInput<AlertmanagerProviderConfig>,
) {
  return providerParseSucceeded(
    parseAlertmanagerCompatibleProvider(input, {
      provider: "alertmanager",
      defaultTitle: "Alertmanager alert",
    }),
  );
}

export function parseAlertmanagerProvider(
  input: ProviderStandaloneParseInput<AlertmanagerProviderConfig>,
): ProviderParseOutput {
  return unwrapProviderParseResult(
    parseAlertmanagerProviderResult(
      completeProviderParseInput("alertmanager", input, input.config ?? {}),
    ),
  );
}
