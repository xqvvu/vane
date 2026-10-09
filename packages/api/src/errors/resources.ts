/**
 * Shared resource error definitions for dashboard procedures.
 *
 * A procedure declares these keys on its contract when its service can raise the
 * matching failure, so the client can narrow on the code instead of parsing a
 * message. The boundary translation lives in
 * `apps/console/src/server/orpc/errors.ts`.
 */
export const resourceErrors = {
  error: {
    NOT_FOUND: {
      message: "The requested resource was not found",
    },
    BAD_REQUEST: {
      message: "The request was rejected",
    },
    CONFLICT: {
      message: "The request conflicts with the current resource state",
    },
  },
};
