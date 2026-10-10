import { createCsrfMiddleware } from "@tanstack/react-start";

/**
 * CSRF protection for dashboard API and server function paths.
 *
 * Webhook intake and health / readiness probes are excluded: webhooks
 * authenticate through Source tokens, probes carry no session.
 */
export const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType, request }) => {
    if (handlerType !== "serverFn" && handlerType !== "router") return false;
    const pathname = new URL(request.url).pathname;
    if (/^\/api\/sources\/[^/]+\/webhook$/.test(pathname)) return false;
    if (pathname === "/api/health" || pathname === "/api/ready") return false;
    // Only CSRF-protect API paths for router handlers; TanStack Router
    // page routes (/, /login, /events, etc.) are also "router" type and
    // must not be blocked on same-origin page navigation.
    if (handlerType === "router" && !pathname.startsWith("/api/")) return false;
    return true;
  },
});
