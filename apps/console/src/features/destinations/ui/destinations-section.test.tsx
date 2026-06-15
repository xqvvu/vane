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
});

function destinationFixture(index: number): DestinationSummary {
  return {
    id: `destination-${index}`,
    name: `Destination ${index}`,
    kind: index % 2 === 0 ? "feishu" : "generic_webhook",
    enabled: index % 2 === 0,
  };
}
