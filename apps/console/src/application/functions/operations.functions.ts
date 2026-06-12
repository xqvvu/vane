import { createServerFn } from "@tanstack/react-start";
import { AlertSeveritySchema, AlertStatusSchema, DeliveryStateSchema } from "@vane/core";
import { z } from "zod";

import { requireDashboardRequestContext } from "#/application/runtime/request-context.ts";

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
  .validator(ListOperationsInputSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    const store = context.container.getSqliteStore();
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
  .validator(DetailInputSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.getSqliteStore().history.getEventDetail(data.id);
  });

export const getDeliveryDetailFn = createServerFn({ method: "GET" })
  .validator(DetailInputSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.getSqliteStore().deliveries.get(data.id);
  });

export const retryDeliveryFn = createServerFn({ method: "POST" })
  .validator(DetailInputSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.getSqliteStore().deliveries.retryNow({
      deliveryId: data.id,
    });
  });

export const runDeliveryWorkerFn = createServerFn({ method: "POST" })
  .validator(RunWorkerInputSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();
    const worker = context.container.createDeliveryWorker();

    return worker.runOnce({
      limit: data?.limit ?? 10,
    });
  });
