import { UpdateAppSettingsCommandSchema, type UpdateAppSettingsCommand } from "@vane/core";

import type {
  AppSettingsServiceOptions,
  UpdateAppSettingsResult,
} from "#/server/configuration/app-settings.service.types.ts";

export class AppSettingsService {
  private readonly store: AppSettingsServiceOptions["store"];

  constructor(options: AppSettingsServiceOptions) {
    this.store = options.store;
  }

  async updateAppSettings(command: UpdateAppSettingsCommand): Promise<UpdateAppSettingsResult> {
    const input = UpdateAppSettingsCommandSchema.parse(command);

    return this.store.settings.update({
      rawPayloadRetentionDays: input.rawPayloadRetentionDays,
    });
  }
}
