import { createFileRoute } from "@tanstack/react-router";

import { type ApplicationContainer, getApplicationContainer } from "#/server/runtime/container";
import type { ReadyResponse } from "#/server/runtime/health.types";

export const Route = createFileRoute("/api/ready")({
  server: {
    handlers: {
      GET: async () => {
        const container: ApplicationContainer = getApplicationContainer();

        const checks: ReadyResponse["checks"] = {
          sqlite: "skipped",
          migrations: "skipped",
          worker: "skipped",
        };

        try {
          const store = await container.getSqliteStore();
          checks.sqlite = "ok";

          const version = await store.schemaVersion();
          checks.migrations = version ? "ok" : "error";

          if (checks.migrations === "ok") {
            await container.ensureDeliveryWorkerRunner();
            checks.worker = "ok";
          }
        } catch {
          if (checks.sqlite === "skipped") {
            checks.sqlite = "error";
          } else if (checks.migrations === "skipped") {
            checks.migrations = "error";
          } else if (checks.worker === "skipped") {
            checks.worker = "error";
          }
        }

        const ready = Object.values(checks).every((v) => v === "ok");

        return Response.json(
          {
            status: ready ? "ok" : "error",
            checks,
          } satisfies ReadyResponse,
          {
            status: ready ? 200 : 503,
          },
        );
      },
    },
  },
});
