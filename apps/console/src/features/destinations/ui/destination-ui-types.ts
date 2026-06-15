import type { JsonObject } from "@vane/core";

import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import type { DestinationFormKind } from "#/features/destinations/model/destination-form.ts";

export type DestinationSummary = Configuration["destinations"][number];

export type DestinationFormMode = "create" | "edit";

export type DestinationFormValues = {
  name: string;
  kind: DestinationFormKind;
  endpointUrl: string;
  to: string;
  from: string;
  replyTo: string;
  subjectPrefix: string;
  headers: string;
  url: string;
  webhookUrl: string;
  method: string;
  signSecret: string;
  messageTemplate: string;
};

export type DestinationFormSubmitInput = {
  name: string;
  kind: DestinationFormKind;
  config: JsonObject;
};

export type CreateDestinationFormInput = DestinationFormSubmitInput;

export type EditDestinationFormInput = DestinationFormSubmitInput & {
  id: string;
};

export type DestinationSubmitResult = unknown;
