import { os } from "@orpc/server";

import { requireDashboardContext } from "#/server/orpc/middlewares/dashboard-context";
import type { ApplicationContainer } from "#/server/runtime/container";
import type { DashboardRequestContext } from "#/server/runtime/request-context";

/** Authenticated context plus the one capability service a procedure needs. */
export interface DashboardServiceContext<TService> {
  dashboardRequest: DashboardRequestContext;
  service: TService;
}

/**
 * Dashboard session guard for oRPC procedures.
 *
 * Attach this per procedure (`os.sources.list.use(requireDashboard())`) instead
 * of on the whole router: router-level middleware would force the UNAUTHORIZED /
 * FORBIDDEN error map onto every procedure, including the public auth and i18n
 * ones. Each procedure that needs it declares the matching keys on its contract.
 *
 * The guard resolves the session from the RPC request headers, so it works for
 * both the browser transport and in-process server calls made through
 * `createRouterClient`.
 *
 * The output context is typed explicitly, so `context.dashboardRequest` is
 * non-optional for procedures that attached the guard. Forgetting
 * `.use(requireDashboard())` therefore fails type checking as soon as the handler
 * reads the authenticated context, instead of being hidden behind a `!`.
 *
 * Prefer `withDashboardService` when the procedure only needs one capability
 * service; reach for this directly when it needs the container itself.
 */
export function requireDashboard() {
  return os.middleware<{ dashboardRequest: DashboardRequestContext }, unknown>(
    async ({ context, next }) => {
      return next({
        context: {
          dashboardRequest: await requireDashboardContext({ reqHeaders: context.reqHeaders }),
        },
      });
    },
  );
}

/**
 * Composes the dashboard guard with the capability service a procedure needs.
 *
 * The service is created from the request-scoped container and injected as
 * `context.service`, so a router file states its dependency once and the handler
 * stays a one-line delegation:
 *
 * ```ts
 * const withSourceService = withDashboardService((container) => container.createSourceService());
 *
 * create: os.sources.create
 *   .use(withSourceService)
 *   .handler(({ context, input }) => context.service.createSource(input));
 * ```
 *
 * "Session guard plus service resolution" therefore lives in the boundary layer
 * and business logic stays in `*.service.ts`; handlers no longer reach through
 * `context.dashboardRequest.container` themselves.
 */
export function withDashboardService<TService>(
  createService: (container: ApplicationContainer) => Promise<TService>,
) {
  return os.middleware<DashboardServiceContext<TService>, unknown>(async ({ context, next }) => {
    const dashboardRequest = await requireDashboardContext({ reqHeaders: context.reqHeaders });

    return next({
      context: {
        dashboardRequest,
        service: await createService(dashboardRequest.container),
      },
    });
  });
}
