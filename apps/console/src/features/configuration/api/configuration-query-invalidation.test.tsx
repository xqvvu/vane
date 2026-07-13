// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useConfigurationMutations } from "#/features/configuration/api/configuration.mutations.ts";
import { useDestinationMutations } from "#/features/destinations/api/destination.mutations.ts";
import { useRouteMutations } from "#/features/routes/api/route.mutations.ts";
import { useSourceMutations } from "#/features/sources/api/source.mutations.ts";

const testState = vi.hoisted(() => ({
  invalidateQueries: vi.fn<(input: { queryKey: readonly string[] }) => Promise<void>>(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => ({ invalidateQueries: testState.invalidateQueries }),
}));

vi.mock("@tanstack/react-start", () => ({
  useServerFn: (serverFn: unknown) => serverFn,
}));

vi.mock("#/server/functions/configuration.functions.ts", () => {
  const serverFn = vi.fn<() => void>();

  return {
    createDestinationFn: serverFn,
    createRouteFn: serverFn,
    createSourceFn: serverFn,
    deleteDestinationFn: serverFn,
    deleteRouteFn: serverFn,
    deleteSourceFn: serverFn,
    exportConfigurationJsonFn: serverFn,
    exportConfigurationTomlFn: serverFn,
    importConfigurationJsonFn: serverFn,
    importConfigurationTomlFn: serverFn,
    previewDestinationDraftFn: serverFn,
    previewDestinationFn: serverFn,
    previewDestinationUpdateFn: serverFn,
    rotateSourceTokenFn: serverFn,
    testDestinationFn: serverFn,
    updateAppSettingsFn: serverFn,
    updateDestinationFn: serverFn,
    updateRouteFn: serverFn,
    updateSourceFn: serverFn,
  };
});

describe("configuration query invalidation", () => {
  beforeEach(() => {
    testState.invalidateQueries.mockReset().mockResolvedValue(undefined);
  });

  it("invalidates every imported configuration capability", async () => {
    const { result } = renderHook(() => useConfigurationMutations());

    await result.current.invalidateConfiguration();

    expect(testState.invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ["app-settings"] }],
      [{ queryKey: ["sources"] }],
      [{ queryKey: ["destinations"] }],
      [{ queryKey: ["routes"] }],
    ]);
  });

  it("invalidates source summaries and affected route references", async () => {
    const { result } = renderHook(() => useSourceMutations());

    await result.current.invalidateSources();

    expect(testState.invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ["sources"] }],
      [{ queryKey: ["routes"] }],
    ]);
  });

  it("invalidates destination summaries and affected route references", async () => {
    const { result } = renderHook(() => useDestinationMutations());

    await result.current.invalidateDestinations();

    expect(testState.invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ["destinations"] }],
      [{ queryKey: ["routes"] }],
    ]);
  });

  it("invalidates only routes after route mutations", async () => {
    const { result } = renderHook(() => useRouteMutations());

    await result.current.invalidateRoutes();

    expect(testState.invalidateQueries.mock.calls).toEqual([[{ queryKey: ["routes"] }]]);
  });
});
