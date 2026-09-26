import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";

import { HealthCheckOutput } from "../schemas/health";

export const health = {
  check: oc.meta(openapi({ method: "GET" })).output(HealthCheckOutput),
};
