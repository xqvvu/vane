import { createServerFn } from "@tanstack/react-start";

export const getDashboardSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { requireDashboardRequestContext } =
      await import("#/application/runtime/request-context.ts");
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

export const getAuthBootstrapFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getApplicationContainer } = await import("#/application/runtime/container.ts");

  return {
    setupRequired: !getApplicationContainer().hasRegisteredUsers(),
  };
});
