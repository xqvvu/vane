import { orpc } from "#/lib/orpc";

export const feishuAppQueryKeys = {
  all: ["integrations", "feishu-apps"] as const,
  list: () => [...feishuAppQueryKeys.all, "list"] as const,
};

export function feishuAppsQueryOptions() {
  return orpc.integrations.listFeishuApps.queryOptions({
    queryKey: feishuAppQueryKeys.list(),
  });
}
