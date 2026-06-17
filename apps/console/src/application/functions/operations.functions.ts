import { createServerFn } from "@tanstack/react-start";
import { AlertSeveritySchema, AlertStatusSchema, DeliveryStateSchema } from "@vane/core";
import { z } from "zod";

import { requireDashboardContextMiddleware } from "#/application/functions/dashboard-context.middleware.ts";

const ListOperationsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(20),
    sourceId: z.string().min(1).optional(),
    severity: AlertSeveritySchema.optional(),
    status: AlertStatusSchema.optional(),
    destinationId: z.string().min(1).optional(),
    deliveryState: DeliveryStateSchema.optional(),
    q: z.string().trim().min(1).max(120).optional(),
    eventCursor: z.string().min(1).optional(),
    deliveryCursor: z.string().min(1).optional(),
  })
  .optional();

const DetailInputSchema = z.object({
  id: z.string().min(1),
});

const RunWorkerInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
  })
  .optional();

export const listOperationsFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ListOperationsInputSchema)
  .handler(async ({ data, context }) => {
    const store = context.dashboardRequest.container.getSqliteStore();
    const limit = data?.limit ?? 20;

    return {
      events: store.history.listEvents({
        limit,
        sourceId: data?.sourceId,
        severity: data?.severity,
        status: data?.status,
        q: data?.q,
        cursor: data?.eventCursor,
      }),
      deliveries: store.history.listDeliveries({
        limit,
        sourceId: data?.sourceId,
        severity: data?.severity,
        status: data?.status,
        destinationId: data?.destinationId,
        state: data?.deliveryState,
        q: data?.q,
        cursor: data?.deliveryCursor,
      }),
    };
  });

export const getEventDetailFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(DetailInputSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.getSqliteStore().history.getEventDetail(data.id),
  );

export const getDeliveryDetailFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(DetailInputSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.getSqliteStore().deliveries.get(data.id),
  );

export const retryDeliveryFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(DetailInputSchema)
  .handler(async ({ data, context }) => {
    return context.dashboardRequest.container.getSqliteStore().deliveries.retryNow({
      deliveryId: data.id,
    });
  });

export const runDeliveryWorkerFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(RunWorkerInputSchema)
  .handler(async ({ data, context }) => {
    const worker = context.dashboardRequest.container.createDeliveryWorker();

    return worker.runOnce({
      limit: data?.limit ?? 10,
    });
  });
