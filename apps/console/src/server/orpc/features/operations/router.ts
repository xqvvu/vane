import { requireDashboard } from "#/server/orpc/middlewares/require-dashboard";
import { os } from "#/server/orpc/os";

/**
 * Event, delivery, and replay operations.
 *
 * Reads go straight to the SQLite store because they are projection queries with
 * no business rules. Writes (retry, replay, manual worker run) go through the
 * capability services.
 */
export const operationsRouter = os.operations.router({
  list: os.operations.list.use(requireDashboard()).handler(async ({ context, input }) => {
    const store = await context.dashboardRequest!.container.getSqliteStore();
    const limit = input?.limit ?? 20;
    const [events, deliveries] = await Promise.all([
      store.history.listEvents({
        limit,
        sourceId: input?.sourceId,
        severity: input?.severity,
        status: input?.status,
        q: input?.q,
        page: input?.eventPage ?? 1,
      }),
      store.history.listDeliveries({
        limit,
        sourceId: input?.sourceId,
        severity: input?.severity,
        status: input?.status,
        destinationId: input?.destinationId,
        state: input?.deliveryState,
        q: input?.q,
        cursor: input?.deliveryCursor,
      }),
    ]);

    return {
      events,
      deliveries,
    };
  }),

  getEventDetail: os.operations.getEventDetail
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.getSqliteStore()).history.getEventDetail(input.id),
    ),

  getDeliveryDetail: os.operations.getDeliveryDetail
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.getSqliteStore()).deliveries.get(input.id),
    ),

  retryDelivery: os.operations.retryDelivery
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.getSqliteStore()).deliveries.retryNow({
        deliveryId: input.id,
      }),
    ),

  previewEventReplay: os.operations.previewEventReplay
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createEventReplayService()).previewEventReplay(
        input,
      ),
    ),

  replayEvent: os.operations.replayEvent
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createEventReplayService()).replayEvent(input),
    ),

  previewRouteReplay: os.operations.previewRouteReplay
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createEventReplayService()).previewRouteReplay(
        input,
      ),
    ),

  replayRouteEvents: os.operations.replayRouteEvents
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createEventReplayService()).replayRouteEvents(
        input,
      ),
    ),

  runDeliveryWorker: os.operations.runDeliveryWorker
    .use(requireDashboard())
    .handler(async ({ context, input }) => {
      const container = context.dashboardRequest!.container;
      const worker = await container.createDeliveryWorker();
      const result = await worker.runOnce({
        limit: input?.limit ?? 10,
      });

      return {
        ...result,
        health: worker.getHealth(),
        runnerHealth: (await container.ensureDeliveryWorkerRunner()).getHealth(),
      };
    }),
});
