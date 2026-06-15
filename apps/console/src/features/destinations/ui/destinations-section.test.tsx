// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DestinationSummary } from "#/features/destinations/ui/destination-ui-types.ts";
import { DestinationsSection } from "#/features/destinations/ui/destinations-section.tsx";
import { VaneIntlProvider } from "#/i18n/provider.tsx";

type DestinationActionHandler = (destination: DestinationSummary) => void;
type DestinationEditHandler = (destinationId: string) => void;

describe("destinations section table", () => {
  afterEach(() => {
    cleanup();
  });

  it("paginates destinations inside the feature table", () => {
    const destinations = Array.from({ length: 11 }, (_, index) => destinationFixture(index + 1));

    render(
      <VaneIntlProvider locale="en-US">
        <DestinationsSection
          destinations={destinations}
          routes={[]}
          pending={false}
          onTest={vi.fn<DestinationActionHandler>()}
          onPreview={vi.fn<DestinationActionHandler>()}
          onEdit={vi.fn<DestinationEditHandler>()}
          onToggle={vi.fn<DestinationActionHandler>()}
        />
      </VaneIntlProvider>,
    );

    expect(screen.getByText("Destination")).toBeTruthy();
    expect(screen.getByText("Safe configuration")).toBeTruthy();
    expect(screen.getByText("Routing")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.getByText("1-10 of 11 destinations")).toBeTruthy();
    expect(screen.getByText("Destination 10")).toBeTruthy();
    expect(screen.queryByText("Destination 11")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(screen.getByText("11-11 of 11 destinations")).toBeTruthy();
    expect(screen.getByText("Destination 11")).toBeTruthy();
    expect(screen.queryByText("Destination 10")).toBeNull();
  });

  it("renders an operational empty state", () => {
    render(
      <VaneIntlProvider locale="en-US">
        <DestinationsSection
          destinations={[]}
          routes={[]}
          pending={false}
          onTest={vi.fn<DestinationActionHandler>()}
          onPreview={vi.fn<DestinationActionHandler>()}
          onEdit={vi.fn<DestinationEditHandler>()}
          onToggle={vi.fn<DestinationActionHandler>()}
        />
      </VaneIntlProvider>,
    );

    expect(screen.getByText("No destinations configured")).toBeTruthy();
    expect(screen.getByText("No destinations")).toBeTruthy();
  });

  it("summarizes enabled route usage for each destination", () => {
    render(
      <VaneIntlProvider locale="en-US">
        <DestinationsSection
          destinations={[destinationFixture(1), destinationFixture(2)]}
          routes={[
            routeFixture("route-1", "Primary paging", ["destination-1"], true),
            routeFixture("route-2", "Disabled paging", ["destination-1"], false),
            routeFixture("route-3", "Secondary paging", ["destination-2"], true),
          ]}
          pending={false}
          onTest={vi.fn<DestinationActionHandler>()}
          onPreview={vi.fn<DestinationActionHandler>()}
          onEdit={vi.fn<DestinationEditHandler>()}
          onToggle={vi.fn<DestinationActionHandler>()}
        />
      </VaneIntlProvider>,
    );

    expect(screen.getAllByText("1 active")).toHaveLength(2);
    expect(screen.queryByText("Kind")).toBeTruthy();
    expect(screen.queryByText("State")).toBeNull();
  });
});

function destinationFixture(index: number): DestinationSummary {
  return {
    id: `destination-${index}`,
    name: `Destination ${index}`,
    kind: index % 2 === 0 ? "feishu" : "generic_webhook",
    enabled: index % 2 === 0,
  };
}

function routeFixture(id: string, name: string, destinationIds: string[], enabled: boolean) {
  return {
    id,
    name,
    enabled,
    rule: {
      sourceIds: [],
      severities: [],
      statuses: [],
      labels: [],
      titleContains: [],
      messageContains: [],
    },
    destinationIds,
  };
}
