import * as z from "zod";

export const HealthCheckOutput = z.object({
  status: z.literal("ok"),
});
