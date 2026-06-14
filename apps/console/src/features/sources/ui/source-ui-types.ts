import type { JsonObject } from "@vane/core";

import type { Configuration } from "#/features/configuration/model/configuration-types.ts";

export type SourceSummary = Configuration["sources"][number];

export type SourceFormLayout = "compact" | "rail";

export type SourceFormValues = {
  name: string;
  provider: SourceSummary["provider"];
};

export type SourceFormSubmitInput = SourceFormValues & { config?: JsonObject };

export type CreateSourceFormInput = SourceFormSubmitInput;

export type EditSourceFormInput = SourceFormSubmitInput & {
  id: string;
};

export type SourceSubmitResult = boolean | void | Promise<boolean | void>;
