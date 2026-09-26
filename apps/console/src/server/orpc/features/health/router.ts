import { os } from "#/server/orpc/os";

/** Liveness probe shared by the console shell and monitoring. */
export const healthRouter = os.health.router({
  check: os.health.check.handler(() => {
    return {
      status: "ok",
    };
  }),
});
