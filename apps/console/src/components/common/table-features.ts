import {
  columnVisibilityFeature,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * Shared TanStack Table v9 feature set for console tables.
 *
 * `rowPaginationFeature` and its paginated row model back the client-side
 * pagination used by configuration tables; `columnVisibilityFeature` backs
 * `row.getVisibleCells()`. The core row model is always available and is not
 * registered here.
 */
export const consoleTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

export type ConsoleTableFeatures = typeof consoleTableFeatures;
