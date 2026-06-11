import "@tanstack/react-start/server-only";
import { randomUUID } from "node:crypto";

import type { SqliteDatabase } from "#/infra/sqlite/connection.ts";
import { transaction, type SyncTransactionGuard } from "#/infra/sqlite/transaction.ts";
import type { IsoDateTimeString } from "#/infra/sqlite/types.ts";

export interface SqliteRepositoryContextOptions {
  db: SqliteDatabase;
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

export class SqliteRepositoryContext {
  readonly db: SqliteDatabase;
  readonly now: () => IsoDateTimeString;
  readonly ids: {
    source: () => string;
    destination: () => string;
    route: () => string;
    event: () => string;
    delivery: () => string;
    attempt: () => string;
  };

  constructor(options: SqliteRepositoryContextOptions) {
    this.db = options.db;
    this.now = options.now ?? (() => new Date().toISOString());
    this.ids = {
      source: options.ids?.source ?? randomUUID,
      destination: options.ids?.destination ?? randomUUID,
      route: options.ids?.route ?? randomUUID,
      event: options.ids?.event ?? randomUUID,
      delivery: options.ids?.delivery ?? randomUUID,
      attempt: options.ids?.attempt ?? randomUUID,
    };
  }

  runInTransaction<T>(fn: () => T, ...guard: SyncTransactionGuard<T>): T {
    return transaction(this.db, fn, ...guard);
  }
}
