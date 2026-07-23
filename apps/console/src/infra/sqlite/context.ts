import "@tanstack/react-start/server-only";
import { randomUUID } from "node:crypto";

import type { IsoDateTimeString } from "@vane/core";

import type { VaneSqliteExecutor, VaneSqliteTransaction } from "#/infra/sqlite/schema";
import { transaction } from "#/infra/sqlite/transaction";

export interface SqliteRepositoryContextOptions {
  db: VaneSqliteExecutor;
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
  readonly db: VaneSqliteExecutor;
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

  async runInTransaction<T>(fn: (context: SqliteRepositoryContext) => Promise<T>): Promise<T> {
    if (this.db.isTransaction) {
      return fn(this);
    }

    return transaction(this.db, async (tx) => fn(this.withDb(tx)));
  }

  private withDb(db: VaneSqliteTransaction): SqliteRepositoryContext {
    return new SqliteRepositoryContext({
      db,
      now: this.now,
      ids: this.ids,
    });
  }
}
