import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import {
  CreateDestinationCommandSchema,
  DeleteDestinationCommandSchema,
  GetDestinationTemplateDraftCommandSchema,
  PreviewDestinationCommandSchema,
  PreviewDestinationDraftCommandSchema,
  PreviewDestinationUpdateCommandSchema,
  TestDestinationCommandSchema,
  UpdateDestinationCommandSchema,
} from "@vane/core";

import { dashboardAuth } from "../errors/dashboard-auth";
import {
  DestinationCatalogOutputSchema,
  DestinationDeleteOutputSchema,
  DestinationListOutputSchema,
  DestinationOutputSchema,
  DestinationPreviewOutputSchema,
  DestinationTemplateDraftOutputSchema,
  DestinationTestOutputSchema,
} from "../schemas/destinations";

const dashboardErrors = dashboardAuth.error;

/**
 * Outbound destination administration.
 *
 * List and detail DTOs carry the operational fields an on-call operator needs
 * (endpoint, method, recipients, header names). Signing secrets, passwords, and
 * sensitive header values stay server-side.
 */
export const destinations = {
  list: oc
    .meta(openapi({ method: "GET" }))
    .errors(dashboardErrors)
    .output(DestinationListOutputSchema),

  // Static adapter registry metadata; the service answers synchronously.
  listCatalog: oc
    .meta(openapi({ method: "GET" }))
    .errors(dashboardErrors)
    .output(DestinationCatalogOutputSchema),

  getTemplateDraft: oc
    .meta(openapi({ method: "GET" }))
    .input(GetDestinationTemplateDraftCommandSchema)
    .errors(dashboardErrors)
    .output(DestinationTemplateDraftOutputSchema),

  create: oc
    .meta(openapi({ method: "POST" }))
    .input(CreateDestinationCommandSchema)
    .errors(dashboardErrors)
    .output(DestinationOutputSchema),

  update: oc
    .meta(openapi({ method: "POST" }))
    .input(UpdateDestinationCommandSchema)
    .errors(dashboardErrors)
    .output(DestinationOutputSchema),

  delete: oc
    .meta(openapi({ method: "POST" }))
    .input(DeleteDestinationCommandSchema)
    .errors(dashboardErrors)
    .output(DestinationDeleteOutputSchema),

  test: oc
    .meta(openapi({ method: "POST" }))
    .input(TestDestinationCommandSchema)
    .errors(dashboardErrors)
    .output(DestinationTestOutputSchema),

  preview: oc
    .meta(openapi({ method: "POST" }))
    .input(PreviewDestinationCommandSchema)
    .errors(dashboardErrors)
    .output(DestinationPreviewOutputSchema),

  previewDraft: oc
    .meta(openapi({ method: "POST" }))
    .input(PreviewDestinationDraftCommandSchema)
    .errors(dashboardErrors)
    .output(DestinationPreviewOutputSchema),

  previewUpdate: oc
    .meta(openapi({ method: "POST" }))
    .input(PreviewDestinationUpdateCommandSchema)
    .errors(dashboardErrors)
    .output(DestinationPreviewOutputSchema),
};
