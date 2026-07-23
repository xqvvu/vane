import type { AlertStatus, JsonObject } from "@vane/core";

import type {
  DestinationFormKind,
  DestinationTemplateFormState,
} from "#/features/destinations/model/destination-form";
export type {
  DestinationCatalog,
  DestinationSummary,
} from "#/features/destinations/model/destination-types";

export type DestinationFormMode = "create" | "edit";

export type DestinationFormValues = DestinationTemplateFormState & {
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
};

export type DestinationFormSubmitInput = {
  name: string;
  kind: DestinationFormKind;
  config: JsonObject;
};

export type DestinationFormPreviewInput = DestinationFormSubmitInput & {
  sampleStatus: AlertStatus;
};

export type CreateDestinationFormInput = DestinationFormSubmitInput;
export type PreviewDestinationFormInput = DestinationFormPreviewInput;
export type PreviewEditDestinationFormInput = DestinationFormPreviewInput & {
  id: string;
};

export type EditDestinationFormInput = DestinationFormSubmitInput & {
  id: string;
};

export type DestinationSubmitResult = unknown;
