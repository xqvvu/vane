import "@tanstack/react-start/server-only";
import type sqlite from "node:sqlite";

export function transaction<T>(db: sqlite.DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");

  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
