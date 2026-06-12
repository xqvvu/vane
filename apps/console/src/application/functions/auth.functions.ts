import { createServerFn } from "@tanstack/react-start";

import { requireDashboardRequestContext } from "#/application/runtime/request-context.ts";

export const getDashboardSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const context = await requireDashboardRequestContext();

    return {
      user: {
        id: context.currentUser.id,
        email: context.currentUser.email,
        role: context.currentUser.role ?? null,
      },
    };
  } catch {
    return null;
  }
});
