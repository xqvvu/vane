import { UpdateAppSettingsCommandSchema, type UpdateAppSettingsCommand } from "@vane/core";

import type { SqliteStore } from "#/infra/sqlite/store.ts";
import type { AppSettings } from "#/repositories/settings/settings.interface.ts";

export interface AppSettingsServiceOptions {
  store: SqliteStore;
}

export class AppSettingsService {
  private readonly store: SqliteStore;

  constructor(options: AppSettingsServiceOptions) {
    this.store = options.store;
  }

  updateAppSettings(command: UpdateAppSettingsCommand): AppSettings {
    const input = UpdateAppSettingsCommandSchema.parse(command);

    return this.store.settings.update({
      rawPayloadRetentionDays: input.rawPayloadRetentionDays,
    });
  }
}
