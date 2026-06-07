import "@tanstack/react-start/server-only";
import { randomUUID } from "node:crypto";
import type sqlite from "node:sqlite";

import { transaction } from "#/infra/sqlite/transaction.ts";
import type { IsoDateTimeString } from "#/infra/sqlite/types.ts";

export interface SqliteRepositoryContextOptions {
  db: sqlite.DatabaseSync;
  now?: () => IsoDateTimeString;
  ids?: Partial<{
    event: () => string;
    delivery: () => string;
    attempt: () => string;
  }>;
}

export class SqliteRepositoryContext {
  readonly db: sqlite.DatabaseSync;
  readonly now: () => IsoDateTimeString;
  readonly ids: {
    event: () => string;
    delivery: () => string;
    attempt: () => string;
  };

  private transactionDepth = 0;

  constructor(options: SqliteRepositoryContextOptions) {
    this.db = options.db;
    this.now = options.now ?? (() => new Date().toISOString());
    this.ids = {
      event: options.ids?.event ?? randomUUID,
      delivery: options.ids?.delivery ?? randomUUID,
      attempt: options.ids?.attempt ?? randomUUID,
    };
  }

  runInTransaction<T>(fn: () => T): T {
    if (this.transactionDepth > 0) {
      return fn();
    }

    return transaction(this.db, () => {
      this.transactionDepth += 1;

      try {
        return fn();
      } finally {
        this.transactionDepth -= 1;
      }
    });
  }
}
