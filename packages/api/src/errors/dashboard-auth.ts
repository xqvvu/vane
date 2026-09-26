/**
 * Dashboard authentication and authorization error definitions.
 *
 * Every dashboard procedure declares these keys on its contract, so the client
 * sees the same well-known error codes whether the request fails on the RPC
 * boundary or in the console middleware. Messages are duplicated in
 * `#/server/runtime/dashboard-session` because that module must stay free of
 * API-package imports; keep both sides in sync when the copy changes.
 */
export const dashboardAuth = {
  error: {
    UNAUTHORIZED: {
      message: "Dashboard authentication required",
    },
    FORBIDDEN: {
      message: "Dashboard owner or admin access required",
    },
  },
};

