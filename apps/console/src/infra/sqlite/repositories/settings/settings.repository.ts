import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  DEFAULT_RAW_PAYLOAD_RETENTION_DAYS,
  RAW_PAYLOAD_RETENTION_DAYS_KEY,
} from "#/infra/sqlite/repositories/settings/settings.helpers.ts";
import type {
  AppSettings,
  SettingsRepository,
} from "#/infra/sqlite/repositories/settings/settings.interface.ts";

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
