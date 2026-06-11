import "@tanstack/react-start/server-only";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";

export interface AppSettings {
  rawPayloadRetentionDays: number;
}

export interface SettingsRepository {
  get(): AppSettings;
  update(input: Partial<AppSettings>): AppSettings;
}

const DEFAULT_RAW_PAYLOAD_RETENTION_DAYS = 30;
const RAW_PAYLOAD_RETENTION_DAYS_KEY = "raw_payload_retention_days";

export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly context: SqliteRepositoryContext) {}

  get(): AppSettings {
    return {
      rawPayloadRetentionDays: this.getNumberSetting(
        RAW_PAYLOAD_RETENTION_DAYS_KEY,
        DEFAULT_RAW_PAYLOAD_RETENTION_DAYS,
      ),
    };
  }

  update(input: Partial<AppSettings>): AppSettings {
    if (input.rawPayloadRetentionDays !== undefined) {
      this.setNumberSetting(RAW_PAYLOAD_RETENTION_DAYS_KEY, input.rawPayloadRetentionDays);
    }

    return this.get();
  }

  private getNumberSetting(key: string, fallback: number): number {
    const row = this.context.db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
      | { value: string }
      | undefined;
    const value = row ? Number(row.value) : fallback;

    return Number.isFinite(value) ? value : fallback;
  }

  private setNumberSetting(key: string, value: number): void {
    const now = this.context.now();

    this.context.db
      .prepare(
        `
          INSERT INTO settings (key, value, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `,
      )
      .run(key, String(value), now);
  }
}
