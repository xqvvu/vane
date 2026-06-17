import type { AppSettings } from "#/infra/sqlite/repositories/settings/settings.interface.ts";
import type { SqliteStore } from "#/infra/sqlite/store.ts";

export interface AppSettingsServiceOptions {
  store: SqliteStore;
}

export type UpdateAppSettingsResult = AppSettings;
