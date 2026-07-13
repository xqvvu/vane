import type { AppSettings } from "@vane/core";

import type { SqliteStore } from "#/infra/sqlite/store.ts";

export interface AppSettingsServiceOptions {
  store: SqliteStore;
}

export type UpdateAppSettingsResult = AppSettings;
