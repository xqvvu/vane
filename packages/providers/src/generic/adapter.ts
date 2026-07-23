import type { ProviderParseOutput, ProviderStandaloneParseInput } from "#providers/types";
import { Adapter, ParseInput, ParseResult } from "#providers/utils";

import { genericProviderManifest } from "#providers/generic/manifest";
import { parseGenericProviderResult } from "#providers/generic/parse";
import { GenericProviderConfigSchema, type GenericProviderConfig } from "#providers/generic/schema";

export const genericProviderAdapter = Adapter.define({
  manifest: genericProviderManifest,
  configSchema: GenericProviderConfigSchema,
  parse: parseGenericProviderResult,
});

export const genericProviderParser = genericProviderAdapter;

export function parseGenericProvider(
  input: ProviderStandaloneParseInput<GenericProviderConfig>,
): ProviderParseOutput {
  return ParseResult.unwrap(
    genericProviderParser.parse(ParseInput.fromStandalone("generic", input, input.config ?? {})),
  );
}
