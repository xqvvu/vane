import { createFileRoute } from "@tanstack/react-router";

import type { HealthResponse } from "#/server/runtime/health.types";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () => {
        return Response.json({ status: "ok" } satisfies HealthResponse);
      },
    },
  },
});
