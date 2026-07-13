import type { AppSettings } from "@vane/core";

export type { AppSettings } from "@vane/core";

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  update(input: Partial<AppSettings>): Promise<AppSettings>;
}
