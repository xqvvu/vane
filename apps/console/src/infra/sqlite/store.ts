import { createSqliteDatabase, type SqliteDatabase } from "#/infra/sqlite/connection.ts";
import { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import { migrateSqliteDatabase } from "#/infra/sqlite/migrate.ts";
import type { SyncTransactionGuard } from "#/infra/sqlite/transaction.ts";
import type { IsoDateTimeString } from "#/infra/sqlite/types.ts";
import type { DeliveryRepository } from "#/repositories/delivery/delivery.interface.ts";
import { SqliteDeliveryRepository } from "#/repositories/delivery/delivery.repository.ts";
import type { DestinationRepository } from "#/repositories/destination/destination.interface.ts";
import { SqliteDestinationRepository } from "#/repositories/destination/destination.repository.ts";
import type { HistoryRepository } from "#/repositories/history/history.interface.ts";
import { SqliteHistoryRepository } from "#/repositories/history/history.repository.ts";
import type { IntakeRepository } from "#/repositories/intake/intake.interface.ts";
import { SqliteIntakeRepository } from "#/repositories/intake/intake.repository.ts";
import type { RouteRepository } from "#/repositories/route/route.interface.ts";
import { SqliteRouteRepository } from "#/repositories/route/route.repository.ts";
import type { SettingsRepository } from "#/repositories/settings/settings.interface.ts";
import { SqliteSettingsRepository } from "#/repositories/settings/settings.repository.ts";
import type { SourceRepository } from "#/repositories/source/source.interface.ts";
import { SqliteSourceRepository } from "#/repositories/source/source.repository.ts";

export interface OpenSqliteStoreOptions {
  databasePath?: string;
  migrate?: boolean;
  migrationsDir?: string;
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
  readonly schemaVersion: string | null;

  close(): void;
  transaction<T>(fn: (tx: SqliteStoreUnitOfWork) => T, ...guard: SyncTransactionGuard<T>): T;
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
    private readonly db: SqliteDatabase,
    private readonly context: SqliteRepositoryContext,
  ) {
    this.repositories = createSqliteRepositories(context);
  }

  get schemaVersion(): string | null {
    const row = this.db
      .prepare("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1")
      .get() as { version: string } | undefined;

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

  close(): void {
    this.db.close();
  }

  transaction<T>(fn: (tx: SqliteStoreUnitOfWork) => T, ...guard: SyncTransactionGuard<T>): T {
    return this.context.runInTransaction(() => fn(this.repositories), ...guard);
  }
}

export function openSqliteStore(options: OpenSqliteStoreOptions = {}): SqliteStore {
  const db = createSqliteDatabase({ databasePath: options.databasePath });

  if (options.migrate ?? true) {
    migrateSqliteDatabase(db, options.migrationsDir);
  }

  const context = new SqliteRepositoryContext({
    db,
    now: options.now,
    ids: options.ids,
  });

  return new OpenedSqliteStore(db, context);
}
