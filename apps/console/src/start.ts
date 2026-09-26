import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

import { requestLoggingMiddleware } from "#/middlewares/request-logging.middleware";

/**
 * CSRF protection for all dashboard HTTP paths.
 *
 * Webhook intake and health / readiness probes are excluded: webhooks
 * authenticate through Source tokens, probes carry no session.
 * Everything else (server function calls, oRPC RPC/OpenAPI handlers)
 * must pass a same-origin check so cross-site cookie stealing is
 * blocked even though the oRPC routes are handled via the router path.
 */
const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType, request }) => {
    if (handlerType !== "serverFn" && handlerType !== "router") return false;
    const pathname = new URL(request.url).pathname;
    if (/^\/api\/sources\/[^/]+\/webhook$/.test(pathname)) return false;
    if (pathname === "/api/health" || pathname === "/api/ready") return false;
    return true;
  },
});

export const startInstance = createStart(() => ({
  requestMiddleware: [requestLoggingMiddleware, csrfMiddleware],
}));
