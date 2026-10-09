import { useQueryClient } from "@tanstack/react-query";

import { feishuAppQueryKeys } from "#/features/integrations/api/feishu-app.queries";
import { orpc } from "#/lib/orpc";

/**
 * Feishu app mutation surface.
 * Components should call these hooks instead of importing procedures directly,
 * so invalidation and typed DTOs stay next to the Query layer.
 */
export function useFeishuAppMutations() {
  const queryClient = useQueryClient();

  return {
    createFeishuApp: orpc.integrations.createFeishuApp.call,
    updateFeishuApp: orpc.integrations.updateFeishuApp.call,
    deleteFeishuApp: orpc.integrations.deleteFeishuApp.call,
    testFeishuApp: orpc.integrations.testFeishuApp.call,
    invalidateFeishuApps: () => queryClient.invalidateQueries({ queryKey: feishuAppQueryKeys.all }),
  };
}
