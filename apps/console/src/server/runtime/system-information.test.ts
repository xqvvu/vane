import { describe, expect, it, vi } from "vitest";

import {
  loadSystemInformation,
  logSystemInformation,
  type SystemInformation,
} from "#/server/runtime/system-information.ts";

import packageJson from "../../../../../package.json";

describe("system information", () => {
  it("loads stable runtime and SQLite driver details", () => {
    const information = loadSystemInformation("3.53.0");

    expect(information).toMatchObject({
      version: packageJson.version,
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      environment: "test",
      sqliteDriver: "better-sqlite3",
      sqliteVersion: "3.53.0",
    });
  });

  it("logs the information as structured runtime properties", () => {
    const information: SystemInformation = {
      version: packageJson.version,
      nodeVersion: "v24.18.0",
      platform: "linux",
      architecture: "x64",
      environment: "production",
      sqliteDriver: "better-sqlite3",
      sqliteVersion: "3.53.0",
    };
    const info = vi.fn<(message: string, properties: Record<string, unknown>) => void>();

    logSystemInformation(information, info);

    expect(info).toHaveBeenNthCalledWith(1, "Version: {version}", {
      version: packageJson.version,
    });
    expect(info).toHaveBeenNthCalledWith(2, "Environment: {environment}", {
      environment: "production",
    });
    expect(info).toHaveBeenNthCalledWith(3, "Node version: {nodeVersion}", {
      nodeVersion: "v24.18.0",
    });
    expect(info).toHaveBeenNthCalledWith(4, "Platform: {platform}", { platform: "linux" });
    expect(info).toHaveBeenNthCalledWith(5, "Architecture: {architecture}", {
      architecture: "x64",
    });
    expect(info).toHaveBeenNthCalledWith(6, "SQLite version: {sqliteVersion}", {
      sqliteVersion: "3.53.0",
    });
    expect(info).toHaveBeenNthCalledWith(7, "SQLite driver: {sqliteDriver}", {
      sqliteDriver: "better-sqlite3",
    });
    expect(info).toHaveBeenCalledTimes(7);
  });
});
