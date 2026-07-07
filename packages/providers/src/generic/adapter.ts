import type { ProviderParseOutput, ProviderStandaloneParseInput } from "#/types.ts";
import { Adapter, ParseInput, ParseResult } from "#/utils.ts";

import { genericProviderManifest } from "#/generic/manifest.ts";
import { parseGenericProviderResult } from "#/generic/parse.ts";
import { GenericProviderConfigSchema, type GenericProviderConfig } from "#/generic/schema.ts";

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
