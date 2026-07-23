import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  AlertSeveritySchema,
  AlertStatusSchema,
  DeliveryStateSchema,
  PreviewRouteReplayCommandSchema,
  ReplayEventCommandSchema,
  ReplayRouteEventsCommandSchema,
} from "@vane/core";

import { requireDashboardContextMiddleware } from "#/middlewares/dashboard-context.middleware";

const ListOperationsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(20),
    sourceId: z.string().min(1).optional(),
    severity: AlertSeveritySchema.optional(),
    status: AlertStatusSchema.optional(),
    destinationId: z.string().min(1).optional(),
    deliveryState: DeliveryStateSchema.optional(),
    q: z.string().trim().min(1).max(120).optional(),
    eventPage: z.number().int().min(1).default(1),
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
    const store = await context.dashboardRequest.container.getSqliteStore();
    const limit = data?.limit ?? 20;
    const [events, deliveries] = await Promise.all([
      store.history.listEvents({
        limit,
        sourceId: data?.sourceId,
        severity: data?.severity,
        status: data?.status,
        q: data?.q,
        page: data?.eventPage ?? 1,
      }),
      store.history.listDeliveries({
        limit,
        sourceId: data?.sourceId,
        severity: data?.severity,
        status: data?.status,
        destinationId: data?.destinationId,
        state: data?.deliveryState,
        q: data?.q,
        cursor: data?.deliveryCursor,
      }),
    ]);

    return {
      events,
      deliveries,
    };
  });

export const getEventDetailFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(DetailInputSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.getSqliteStore()).history.getEventDetail(data.id),
  );

export const getDeliveryDetailFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(DetailInputSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.getSqliteStore()).deliveries.get(data.id),
  );

export const retryDeliveryFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(DetailInputSchema)
  .handler(async ({ data, context }) => {
    return (await context.dashboardRequest.container.getSqliteStore()).deliveries.retryNow({
      deliveryId: data.id,
    });
  });

export const previewEventReplayFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ReplayEventCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createEventReplayService()).previewEventReplay(data),
  );

export const replayEventFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ReplayEventCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createEventReplayService()).replayEvent(data),
  );

export const previewRouteReplayFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(PreviewRouteReplayCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createEventReplayService()).previewRouteReplay(data),
  );

export const replayRouteEventsFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ReplayRouteEventsCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createEventReplayService()).replayRouteEvents(data),
  );

export const runDeliveryWorkerFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(RunWorkerInputSchema)
  .handler(async ({ data, context }) => {
    const container = context.dashboardRequest.container;
    const worker = await container.createDeliveryWorker();
    const result = await worker.runOnce({
      limit: data?.limit ?? 10,
    });

    return {
      ...result,
      health: worker.getHealth(),
      runnerHealth: (await container.ensureDeliveryWorkerRunner()).getHealth(),
    };
  });
