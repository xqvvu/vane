import type { IsoDateTimeString } from "@vane/core";

import { createSqliteDatabase } from "#/infra/sqlite/connection.ts";
import { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import type { SqliteMigration } from "#/infra/sqlite/migrate";
import { migrateSqliteDatabase } from "#/infra/sqlite/migrate";
import type { DeliveryRepository } from "#/infra/sqlite/repositories/delivery/delivery.interface.ts";
import { SqliteDeliveryRepository } from "#/infra/sqlite/repositories/delivery/delivery.repository.ts";
import type { DestinationRepository } from "#/infra/sqlite/repositories/destination/destination.interface.ts";
import { SqliteDestinationRepository } from "#/infra/sqlite/repositories/destination/destination.repository.ts";
import type { HistoryRepository } from "#/infra/sqlite/repositories/history/history.interface.ts";
import { SqliteHistoryRepository } from "#/infra/sqlite/repositories/history/history.repository.ts";
import type { IntakeRepository } from "#/infra/sqlite/repositories/intake/intake.interface.ts";
import { SqliteIntakeRepository } from "#/infra/sqlite/repositories/intake/intake.repository.ts";
import type { RouteRepository } from "#/infra/sqlite/repositories/route/route.interface.ts";
import { SqliteRouteRepository } from "#/infra/sqlite/repositories/route/route.repository.ts";
import type { SettingsRepository } from "#/infra/sqlite/repositories/settings/settings.interface.ts";
import { SqliteSettingsRepository } from "#/infra/sqlite/repositories/settings/settings.repository.ts";
import type { SourceRepository } from "#/infra/sqlite/repositories/source/source.interface.ts";
import { SqliteSourceRepository } from "#/infra/sqlite/repositories/source/source.repository.ts";
import type { VaneSqliteKysely } from "#/infra/sqlite/schema.ts";

export interface OpenSqliteStoreOptions {
  databasePath?: string;
  migrate?: boolean;
  migrationPlan?: readonly SqliteMigration[];
  now?: () => IsoDateTimeString;
  ids?: Partial<{
    source: () => string;
    destination: () => string;
    route: () => string;
    event: () => string;
    delivery: () => string;
    attempt: () => string;
  }>;
}

export interface SqliteStoreUnitOfWork {
  readonly sources: SourceRepository;
  readonly destinations: DestinationRepository;
  readonly routes: RouteRepository;
  readonly intake: IntakeRepository;
  readonly deliveries: DeliveryRepository;
  readonly history: HistoryRepository;
  readonly settings: SettingsRepository;
}

export interface SqliteStore extends SqliteStoreUnitOfWork {
  schemaVersion(): Promise<string | null>;

  close(): Promise<void>;
  transaction<T>(fn: (tx: SqliteStoreUnitOfWork) => Promise<T>): Promise<T>;
}

export interface SqliteRepositorySet extends SqliteStoreUnitOfWork {}

export function createSqliteRepositories(context: SqliteRepositoryContext): SqliteRepositorySet {
  const sources = new SqliteSourceRepository(context);
  const destinations = new SqliteDestinationRepository(context);
  const routes = new SqliteRouteRepository(context);
  const intake = new SqliteIntakeRepository(context);
  const deliveries = new SqliteDeliveryRepository(context, sources, destinations, routes, intake);
  const history = new SqliteHistoryRepository(context, sources, intake, routes, deliveries);
  const settings = new SqliteSettingsRepository(context);

  return {
    sources,
    destinations,
    routes,
    intake,
    deliveries,
    history,
    settings,
  };
}

export class OpenedSqliteStore implements SqliteStore {
  private readonly repositories: SqliteRepositorySet;

  constructor(
    private readonly db: VaneSqliteKysely,
    private readonly context: SqliteRepositoryContext,
  ) {
    this.repositories = createSqliteRepositories(context);
  }

  async schemaVersion(): Promise<string | null> {
    const row = await this.db
      .selectFrom("schema_migrations")
      .select("version")
      .orderBy("version", "desc")
      .limit(1)
      .executeTakeFirst();

    return row?.version ?? null;
  }

  get sources() {
    return this.repositories.sources;
  }

  get destinations() {
    return this.repositories.destinations;
  }

  get routes() {
    return this.repositories.routes;
  }

  get intake() {
    return this.repositories.intake;
  }

  get deliveries() {
    return this.repositories.deliveries;
  }

  get history() {
    return this.repositories.history;
  }

  get settings() {
    return this.repositories.settings;
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }

  transaction<T>(fn: (tx: SqliteStoreUnitOfWork) => Promise<T>): Promise<T> {
    return this.context.runInTransaction(async (context) => fn(createSqliteRepositories(context)));
  }
}

export async function openSqliteStore(options: OpenSqliteStoreOptions = {}): Promise<SqliteStore> {
  const db = createSqliteDatabase({ databasePath: options.databasePath });

  if (options.migrate ?? true) {
    await migrateSqliteDatabase(db, { plan: options.migrationPlan });
  }

  const context = new SqliteRepositoryContext({
    db,
    now: options.now,
    ids: options.ids,
  });

  return new OpenedSqliteStore(db, context);
}
