import { createServerFn } from "@tanstack/react-start";

import { getApplicationContainer } from "#/application/runtime/container.ts";
import { requireDashboardRequestContext } from "#/application/runtime/request-context.ts";

export const getDashboardSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const context = await requireDashboardRequestContext();

    return {
      user: {
        id: context.currentUser.id,
        name: context.currentUser.name ?? null,
        email: context.currentUser.email,
        image: context.currentUser.image ?? null,
        role: context.currentUser.role ?? null,
      },
    };
  } catch {
    return null;
  }
});

export const getAuthBootstrapFn = createServerFn({ method: "GET" }).handler(async () => ({
  setupRequired: !getApplicationContainer().hasRegisteredUsers(),
}));
