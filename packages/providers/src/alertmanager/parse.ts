import { parseAlertmanagerCompatibleProvider } from "#providers/shared/alertmanager-compatible";
import {
  type ProviderParseInput,
  type ProviderParseOutput,
  type ProviderStandaloneParseInput,
} from "#providers/types";
import { ParseInput, ParseResult } from "#providers/utils";

import type { AlertmanagerProviderConfig } from "#providers/alertmanager/schema";

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
