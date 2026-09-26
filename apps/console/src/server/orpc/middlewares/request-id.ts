import { os } from "@orpc/server";

import { resolveRequestId } from "#/middlewares/request-logging.middleware";

/**
 * Publishes the request id onto the oRPC context.
 *
 * The TanStack request middleware already canonicalizes the inbound
 * `x-request-id` / `x-correlation-id` header and stamps it onto the request
 * headers, so resolving the id through the same reader keeps the browser
 * transport and in-process `createRouterClient` calls on one id instead of
 * minting a new one per procedure.
 */
export function requestId() {
  return os.middleware(async ({ context, next }) => {
    const requestId = resolveRequestId(context.reqHeaders ?? new Headers());

    context.resHeaders?.set("x-request-id", requestId);

    return next({
      context: {
        requestId,
      },
    });
  });
}

declare module "@orpc/server" {
  export interface DefaultInitialContext {
    requestId?: string;
  }
}
