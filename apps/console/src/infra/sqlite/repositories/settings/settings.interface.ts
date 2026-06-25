export interface AppSettings {
  rawPayloadRetentionDays: number;
}

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  update(input: Partial<AppSettings>): Promise<AppSettings>;
}
