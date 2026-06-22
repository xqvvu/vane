import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createSqliteDatabase } from "#/infra/sqlite/connection.ts";

describe("sqlite connection", () => {
  it("creates the database parent directory before opening a file database", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vane-sqlite-"));
    const databasePath = path.join(tempDir, "data", "vane.sqlite");

    try {
      const db = createSqliteDatabase({ databasePath });

      try {
        expect(fs.existsSync(path.dirname(databasePath))).toBe(true);
        expect(fs.existsSync(databasePath)).toBe(true);
      } finally {
        db.close();
      }
    } finally {
      fs.rmSync(tempDir, { force: true, recursive: true });
    }
  });
});
