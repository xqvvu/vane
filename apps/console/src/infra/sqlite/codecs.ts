import { SqliteDataIntegrityError } from "#/infra/sqlite/errors";

export type SqliteBoolean = 0 | 1;
export type SqliteJsonText = string;

export function toSqliteBoolean(value: boolean): SqliteBoolean {
  return value ? 1 : 0;
}

export function fromSqliteBoolean(value: number): boolean {
  if (value === 0) {
    return false;
  }

  if (value === 1) {
    return true;
  }

  throw new SqliteDataIntegrityError(`Expected SQLite boolean 0 or 1, received ${value}`);
}

export function rowOrUndefined<Row>(row: unknown): Row | undefined {
  return row === undefined ? undefined : (row as Row);
}

export function rowAs<Row>(row: unknown): Row {
  return row as Row;
}

export function rowsAs<Row>(rows: unknown[]): Row[] {
  return rows as Row[];
}
