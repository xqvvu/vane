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

  async get(): Promise<AppSettings> {
    return {
      rawPayloadRetentionDays: await this.getNumberSetting(
        RAW_PAYLOAD_RETENTION_DAYS_KEY,
        DEFAULT_RAW_PAYLOAD_RETENTION_DAYS,
      ),
    };
  }

  async update(input: Partial<AppSettings>): Promise<AppSettings> {
    if (input.rawPayloadRetentionDays !== undefined) {
      await this.setNumberSetting(RAW_PAYLOAD_RETENTION_DAYS_KEY, input.rawPayloadRetentionDays);
    }

    return this.get();
  }

  private async getNumberSetting(key: string, fallback: number): Promise<number> {
    const row = await this.context.db
      .selectFrom("settings")
      .select("value")
      .where("key", "=", key)
      .executeTakeFirst();
    const value = row ? Number(row.value) : fallback;

    return Number.isFinite(value) ? value : fallback;
  }

  private async setNumberSetting(key: string, value: number): Promise<void> {
    const now = this.context.now();

    await this.context.db
      .insertInto("settings")
      .values({
        key,
        value: String(value),
        updated_at: now,
      })
      .onConflict((oc) =>
        oc.column("key").doUpdateSet({
          value: String(value),
          updated_at: now,
        }),
      )
      .execute();
  }
}
