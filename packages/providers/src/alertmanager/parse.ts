import { parseAlertmanagerCompatibleProvider } from "#/shared/alertmanager-compatible.ts";
import {
  type ProviderParseInput,
  type ProviderParseOutput,
  type ProviderStandaloneParseInput,
} from "#/types.ts";
import { ParseInput, ParseResult } from "#/utils.ts";

import type { AlertmanagerProviderConfig } from "#/alertmanager/schema.ts";

export function parseAlertmanagerProviderResult(
  input: ProviderParseInput<AlertmanagerProviderConfig>,
) {
  return ParseResult.ok(
    parseAlertmanagerCompatibleProvider(input, {
      provider: "alertmanager",
      defaultTitle: "Alertmanager alert",
    }),
  );
}

export function parseAlertmanagerProvider(
  input: ProviderStandaloneParseInput<AlertmanagerProviderConfig>,
): ProviderParseOutput {
  return ParseResult.unwrap(
    parseAlertmanagerProviderResult(
      ParseInput.fromStandalone("alertmanager", input, input.config ?? {}),
    ),
  );
}
