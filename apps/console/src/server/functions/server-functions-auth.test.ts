import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const functionsDir = path.resolve(import.meta.dirname);
const srcDir = path.resolve(functionsDir, "../..");
const routesDir = path.join(srcDir, "routes");
const serverFunctionFiles = readdirSync(functionsDir).filter((fileName) =>
  fileName.endsWith(".functions.ts"),
);

describe("dashboard server function auth gates", () => {
  it.each(serverFunctionFiles)(
    "requires dashboard middleware in every private server function exported by %s",
    (fileName) => {
      const source = readFileSync(path.join(functionsDir, fileName), "utf8");
      const chunks = serverFunctionChunks(source);
      const publicFunctionNames = new Set([
        "getAuthBootstrapFn",
        "getDashboardSessionFn",
        "getRequestLocaleFn",
      ]);

      expect(chunks.map((chunk) => chunk.name)).not.toHaveLength(0);

      for (const chunk of chunks) {
        expect(
          chunk.source.includes(".middleware([requireDashboardContextMiddleware])"),
          `${fileName}:${chunk.name}`,
        ).toBe(!publicFunctionNames.has(chunk.name));
      }
    },
  );

  it("keeps destination configuration RPCs on the dashboard auth path", () => {
    const configuration = readFileSync(
      path.join(functionsDir, "configuration.functions.ts"),
      "utf8",
    );
    const webhookRoute = readFileSync(
      path.join(routesDir, "api/sources/$sourceId/webhook.ts"),
      "utf8",
    );

    for (const name of [
      "listDestinationsFn",
      "createDestinationFn",
      "updateDestinationFn",
      "testDestinationFn",
      "previewDestinationFn",
      "previewDestinationDraftFn",
      "previewDestinationUpdateFn",
      "deleteDestinationFn",
    ]) {
      expect(configuration).toContain(`export const ${name}`);
    }

    expect(configuration).toContain("requireDashboardContextMiddleware");
    expect(configuration).not.toContain("sourceToken");
    expect(configuration).not.toContain("verifySource");
    expect(webhookRoute).not.toContain("requireDashboardContextMiddleware");
    expect(webhookRoute).not.toContain("listDestinationsFn");
    expect(webhookRoute).not.toContain("createDestinationFn");
  });

  it("protects the dashboard route loader with a login redirect", () => {
    const indexRoute = readFileSync(path.join(routesDir, "index.tsx"), "utf8");
    const dashboardRoute = readFileSync(path.join(routesDir, "_dashboard.tsx"), "utf8");
    const loginRoute = readFileSync(path.join(routesDir, "login.tsx"), "utf8");
    const setupRoute = readFileSync(path.join(routesDir, "setup.tsx"), "utf8");
    const authQueries = readFileSync(
      path.join(srcDir, "features/auth/api/auth.queries.ts"),
      "utf8",
    );

    expect(indexRoute).toContain('to: "/events"');
    expect(dashboardRoute).toContain(
      "const session = await context.queryClient.ensureQueryData(dashboardSessionQueryOptions())",
    );
    expect(authQueries).toContain("getDashboardSessionFn()");
    expect(authQueries).toContain("getAuthBootstrapFn()");
    expect(dashboardRoute).toContain("throw redirect({");
    expect(dashboardRoute).toContain('to: "/login"');
    expect(loginRoute).toContain("authBootstrapQueryOptions()");
    expect(loginRoute).toContain('to: "/setup"');
    expect(setupRoute).toContain("authBootstrapQueryOptions()");
    expect(setupRoute).toContain('to: "/login"');
  });
});

function serverFunctionChunks(source: string): Array<{ name: string; source: string }> {
  const matches = [...source.matchAll(/export const (\w+) = createServerFn/g)];

  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const next = matches[index + 1];
    const end = next?.index ?? source.length;

    return {
      name: match[1]!,
      source: source.slice(start, end),
    };
  });
}
