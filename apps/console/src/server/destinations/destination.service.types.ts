import type {
  DestinationDeleteResult,
  DestinationEditorDraftResult,
  DestinationListItem,
  DestinationPreviewResult,
  DestinationTestResult,
} from "@vane/core";
import type { DestinationRegistry, DestinationSendContext } from "@vane/destinations";

import type { SqliteStore } from "#/infra/sqlite/store";

export interface DestinationServiceOptions {
  store: SqliteStore;
  destinations: DestinationRegistry;
  destinationSendContext?: DestinationSendContext;
}

/** Re-exported dashboard DTOs — source of truth is `@vane/core`. */
export type {
  DestinationDeleteResult,
  DestinationEditorDraftResult,
  DestinationListItem,
  DestinationPreviewResult,
  DestinationTestResult,
};

/** Edit dialog draft: operational form fields + template (no signing secrets). */
export type DestinationTemplateDraft = DestinationEditorDraftResult;
