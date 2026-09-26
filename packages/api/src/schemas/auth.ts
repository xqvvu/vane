import * as z from "zod";

/**
 * Dashboard session projection.
 *
 * Only identity fields the console renders. Session identifiers, tokens, and
 * anything the auth runtime keeps server-side never cross this boundary.
 */
export const DashboardSessionOutputSchema = z
  .object({
    user: z.object({
      id: z.string().min(1),
      name: z.string().nullable(),
      email: z.string().min(1),
      image: z.string().nullable(),
      role: z.string().nullable(),
    }),
  })
  .nullable();

/** Whether the instance still needs its first owner account. */
export const AuthBootstrapOutputSchema = z.object({
  setupRequired: z.boolean(),
});
