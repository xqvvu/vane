import "@tanstack/react-start/server-only";
import type sqlite from "node:sqlite";

import { createSqliteDatabase } from "#/infra/sqlite/connection.ts";
import { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import { SqliteDeliveryRepository, type DeliveryRepository } from "#/infra/sqlite/deliveries.ts";
import {
  SqliteDestinationRepository,
  type DestinationRepository,
} from "#/infra/sqlite/destinations.ts";
import { SqliteHistoryRepository, type HistoryRepository } from "#/infra/sqlite/history.ts";
import { SqliteIntakeRepository, type IntakeRepository } from "#/infra/sqlite/intake.ts";
import { migrateSqliteDatabase } from "#/infra/sqlite/migrate.ts";
import { SqliteRouteRepository, type RouteRepository } from "#/infra/sqlite/routes.ts";
import { SqliteSourceRepository, type SourceRepository } from "#/infra/sqlite/sources.ts";
import type { IsoDateTimeString } from "#/infra/sqlite/types.ts";

export interface OpenSqliteStoreOptions {
  databasePath?: string;
  migrate?: boolean;
  migrationsDir?: string;
  now?: () => IsoDateTimeString;
  ids?: Partial<{
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
}

export interface SqliteStore extends SqliteStoreUnitOfWork {
  readonly schemaVersion: string | null;

  close(): void;
  transaction<T>(fn: (tx: SqliteStoreUnitOfWork) => T): T;
}

export interface SqliteRepositorySet extends SqliteStoreUnitOfWork {}

export function createSqliteRepositories(context: SqliteRepositoryContext): SqliteRepositorySet {
  const sources = new SqliteSourceRepository(context);
  const destinations = new SqliteDestinationRepository(context);
  const routes = new SqliteRouteRepository(context);
  const intake = new SqliteIntakeRepository(context);
  const deliveries = new SqliteDeliveryRepository(context, sources, destinations, routes, intake);
  const history = new SqliteHistoryRepository(context, sources, intake, deliveries);

  return {
    sources,
    destinations,
    routes,
    intake,
    deliveries,
    history,
  };
}

export class OpenedSqliteStore implements SqliteStore {
  private readonly repositories: SqliteRepositorySet;

  constructor(
    private readonly db: sqlite.DatabaseSync,
    private readonly context: SqliteRepositoryContext,
  ) {
    this.repositories = createSqliteRepositories(context);
  }

  get schemaVersion(): string | null {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = 'schema_version'").get() as
      | { value: string }
      | undefined;

    return row?.value ?? null;
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

  close(): void {
    this.db.close();
  }

  transaction<T>(fn: (tx: SqliteStoreUnitOfWork) => T): T {
    return this.context.runInTransaction(() => fn(this.repositories));
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
