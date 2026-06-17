export interface AppSettings {
  rawPayloadRetentionDays: number;
}

export interface SettingsRepository {
  get(): AppSettings;
  update(input: Partial<AppSettings>): AppSettings;
}
