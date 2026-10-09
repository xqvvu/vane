import { implement, os as base } from "@orpc/server";

import { contract } from "@vane/api";

import { toContractError } from "#/server/orpc/errors";
import { requestId } from "#/server/orpc/middlewares/request-id";

/**
 * Translates domain failures into typed oRPC errors.
 *
 * Registered at the root so every procedure inherits it, including public ones,
 * and outermost so it also covers failures raised by other middleware. The
 * middleware declares no error map on purpose: keeping the translation out of the
 * contract's error keys means public procedures such as `health.check` do not
 * inherit NOT_FOUND/CONFLICT just because a service can raise them.
 */
const translateErrors = base.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    throw toContractError(error) ?? error;
  }
});

/**
 * The console's single contract implementer.
 *
 * `implement(contract)` binds the API shape from `@vane/api`, so a procedure
 * name that is missing or extra is a type error rather than a runtime 404. The
 * shared middleware chain is error translation, then request id.
 */
export const os = implement(contract).use(translateErrors).use(requestId());
