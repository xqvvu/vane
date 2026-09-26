import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const orpcDir = path.resolve(import.meta.dirname);
const featuresDir = path.join(orpcDir, "features");
const srcDir = path.resolve(orpcDir, "../..");
const routesDir = path.join(srcDir, "routes");
const routerFiles = readdirSync(featuresDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

/**
 * Expected procedure inventory per feature router, mirroring
 * `packages/api/src/contract`. Public procedures are reachable without a
 * dashboard session by design: the login/setup routes need the bootstrap flag,
 * the root route resolves the interface locale before a session exists, and
 * health is a liveness probe.
 */
const expectedProcedures: Record<
  string,
  { public: readonly string[]; private: readonly string[] }
> = {
  auth: { public: ["getDashboardSession", "getAuthBootstrap"], private: [] },
  destinations: {
    public: [],
    private: [
      "list",
      "listCatalog",
      "getTemplateDraft",
      "create",
      "update",
      "delete",
      "test",
      "preview",
      "previewDraft",
      "previewUpdate",
    ],
  },
  health: { public: ["check"], private: [] },
  i18n: { public: ["getRequestLocale"], private: [] },
  operations: {
    public: [],
    private: [
      "list",
      "getEventDetail",
      "getDeliveryDetail",
      "retryDelivery",
      "previewEventReplay",
      "replayEvent",
      "previewRouteReplay",
      "replayRouteEvents",
      "runDeliveryWorker",
    ],
  },
  portability: { public: [], private: ["exportToml", "exportJson", "importToml", "importJson"] },
  routes: { public: [], private: ["list", "create", "update", "delete"] },
  settings: { public: [], private: ["get", "update"] },
  sources: {
    public: [],
    private: ["list", "create", "update", "rotateToken", "delete"],
  },
};

describe("dashboard oRPC auth gates", () => {
  it.each(routerFiles)("gates every private procedure in the %s router", (feature) => {
    const source = readFileSync(path.join(featuresDir, feature, "router.ts"), "utf8");
    const procedures = procedureChunks(source);
    const expected = expectedProcedures[feature];

    expect(expected, `no expected inventory for the ${feature} router`).toBeDefined();
    expect(procedures.map((procedure) => procedure.name).sort()).toEqual(
      [...expected!.public, ...expected!.private].sort(),
    );

    for (const procedure of procedures) {
      expect(
        procedure.source.includes(".use(requireDashboard())"),
        `${feature}:${procedure.name}`,
      ).toBe(expected!.private.includes(procedure.name));
    }
  });

  it("keeps the webhook intake off the dashboard auth path", () => {
    const webhookRoute = readFileSync(
      path.join(routesDir, "api/sources/$sourceId/webhook.ts"),
      "utf8",
    );

    expect(webhookRoute).not.toContain("requireDashboard");
    expect(webhookRoute).not.toContain("orpc");
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
    expect(authQueries).toContain("orpc.auth.getDashboardSession.queryOptions");
    expect(authQueries).toContain("orpc.auth.getAuthBootstrap.queryOptions");
    expect(dashboardRoute).toContain("throw redirect({");
    expect(dashboardRoute).toContain('to: "/login"');
    expect(loginRoute).toContain("authBootstrapQueryOptions()");
    expect(loginRoute).toContain('to: "/setup"');
    expect(setupRoute).toContain("authBootstrapQueryOptions()");
    expect(setupRoute).toContain('to: "/login"');
  });
});

function procedureChunks(source: string): Array<{ name: string; source: string }> {
  const matches = [...source.matchAll(/^ {2}(\w+): os\./gm)];

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
