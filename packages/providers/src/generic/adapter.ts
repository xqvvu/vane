import {
  completeProviderParseInput,
  defineProviderAdapter,
  type ProviderParseOutput,
  type ProviderStandaloneParseInput,
  unwrapProviderParseResult,
} from "#/types.ts";

import { genericProviderManifest } from "./manifest.ts";
import { parseGenericProviderResult } from "./parse.ts";
import { GenericProviderConfigSchema, type GenericProviderConfig } from "./schema.ts";

export const genericProviderAdapter = defineProviderAdapter({
  manifest: genericProviderManifest,
  configSchema: GenericProviderConfigSchema,
  parse: parseGenericProviderResult,
});

export const genericProviderParser = genericProviderAdapter;

export function parseGenericProvider(
  input: ProviderStandaloneParseInput<GenericProviderConfig>,
): ProviderParseOutput {
  return unwrapProviderParseResult(
    genericProviderParser.parse(completeProviderParseInput("generic", input, input.config ?? {})),
  );
}
