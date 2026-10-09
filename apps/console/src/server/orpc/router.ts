import { authRouter } from "#/server/orpc/features/auth/router";
import { destinationsRouter } from "#/server/orpc/features/destinations/router";
import { healthRouter } from "#/server/orpc/features/health/router";
import { i18nRouter } from "#/server/orpc/features/i18n/router";
import { integrationsRouter } from "#/server/orpc/features/integrations/router";
import { operationsRouter } from "#/server/orpc/features/operations/router";
import { portabilityRouter } from "#/server/orpc/features/portability/router";
import { routesRouter } from "#/server/orpc/features/routes/router";
import { settingsRouter } from "#/server/orpc/features/settings/router";
import { sourcesRouter } from "#/server/orpc/features/sources/router";
import { os } from "#/server/orpc/os";

export const router = os.router({
  auth: authRouter,
  destinations: destinationsRouter,
  health: healthRouter,
  i18n: i18nRouter,
  integrations: integrationsRouter,
  operations: operationsRouter,
  portability: portabilityRouter,
  routes: routesRouter,
  settings: settingsRouter,
  sources: sourcesRouter,
});
