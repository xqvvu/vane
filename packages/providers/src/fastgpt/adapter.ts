import { fastgptProviderManifest } from "#providers/fastgpt/manifest";
import { parseFastgptProviderResult } from "#providers/fastgpt/parse";
import { FastgptProviderConfigSchema } from "#providers/fastgpt/schema";
import { Adapter } from "#providers/utils";

export const fastgptProviderAdapter = Adapter.define({
  manifest: fastgptProviderManifest,
  configSchema: FastgptProviderConfigSchema,
  parse: parseFastgptProviderResult,
});

export const fastgptProviderParser = fastgptProviderAdapter;
