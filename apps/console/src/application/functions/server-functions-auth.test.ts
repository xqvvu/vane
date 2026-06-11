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
    "creates dashboard request context in every server function exported by %s",
    (fileName) => {
      const source = readFileSync(path.join(functionsDir, fileName), "utf8");
      const chunks = serverFunctionChunks(source);

      expect(chunks.map((chunk) => chunk.name)).not.toHaveLength(0);

      for (const chunk of chunks) {
        expect(chunk.source, `${fileName}:${chunk.name}`).toContain(
          "requireDashboardRequestContext(",
        );
      }
    },
  );

  it("protects the dashboard route loader with a login redirect", () => {
    const indexRoute = readFileSync(path.join(routesDir, "index.tsx"), "utf8");
    const dashboardRoute = readFileSync(path.join(routesDir, "_dashboard.tsx"), "utf8");
    const authQueries = readFileSync(
      path.join(srcDir, "features/auth/api/auth.queries.ts"),
      "utf8",
    );

    expect(indexRoute).toContain('to: "/events"');
    expect(dashboardRoute).toContain(
      "const session = await context.queryClient.ensureQueryData(dashboardSessionQueryOptions())",
    );
    expect(authQueries).toContain("getDashboardSessionFn()");
    expect(dashboardRoute).toContain("throw redirect({");
    expect(dashboardRoute).toContain('to: "/login"');
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
