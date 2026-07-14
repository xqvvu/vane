import { IanaTimeZoneSchema, VaneLocaleSchema } from "@vane/core/presentation";

import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  DEFAULT_VANE_LOCALE,
  DEFAULT_VANE_TIME_ZONE,
  DEFAULT_RAW_PAYLOAD_RETENTION_DAYS,
  LOCALE_KEY,
  RAW_PAYLOAD_RETENTION_DAYS_KEY,
  TIME_ZONE_KEY,
} from "#/infra/sqlite/repositories/settings/settings.helpers.ts";
import type {
  AppSettings,
  SettingsRepository,
} from "#/infra/sqlite/repositories/settings/settings.interface.ts";

export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly context: SqliteRepositoryContext) {}

  async get(): Promise<AppSettings> {
    return {
      locale: await this.getParsedSetting(LOCALE_KEY, VaneLocaleSchema, DEFAULT_VANE_LOCALE),
      timeZone: await this.getParsedSetting(
        TIME_ZONE_KEY,
        IanaTimeZoneSchema,
        DEFAULT_VANE_TIME_ZONE,
      ),
      rawPayloadRetentionDays: await this.getNumberSetting(
        RAW_PAYLOAD_RETENTION_DAYS_KEY,
        DEFAULT_RAW_PAYLOAD_RETENTION_DAYS,
      ),
    };
  }

  async update(input: Partial<AppSettings>): Promise<AppSettings> {
    if (input.locale !== undefined) {
      await this.setSetting(LOCALE_KEY, VaneLocaleSchema.parse(input.locale));
    }

    if (input.timeZone !== undefined) {
      await this.setSetting(TIME_ZONE_KEY, IanaTimeZoneSchema.parse(input.timeZone));
    }

    if (input.rawPayloadRetentionDays !== undefined) {
      await this.setSetting(RAW_PAYLOAD_RETENTION_DAYS_KEY, String(input.rawPayloadRetentionDays));
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

  private async getParsedSetting<T>(
    key: string,
    schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } },
    fallback: T,
  ): Promise<T> {
    const row = await this.context.db
      .selectFrom("settings")
      .select("value")
      .where("key", "=", key)
      .executeTakeFirst();
    const parsed = schema.safeParse(row?.value);

    return parsed.success ? parsed.data : fallback;
  }

  private async setSetting(key: string, value: string): Promise<void> {
    const now = this.context.now();

    await this.context.db
      .insertInto("settings")
      .values({
        key,
        value,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc.column("key").doUpdateSet({
          value,
          updated_at: now,
        }),
      )
      .execute();
  }
}
