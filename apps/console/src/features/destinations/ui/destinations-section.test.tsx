// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import larkIconUrl from "@vane/destinations/assets/destination-icons/lark.svg?url";
import slackIconUrl from "@vane/destinations/assets/destination-icons/slack.svg?url";
import webhookIconUrl from "@vane/destinations/assets/destination-icons/webhook.svg?url";
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
    expect(screen.getByText("Routing")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
    expect(screen.queryByText("Kind")).toBeNull();
    expect(screen.queryByText("Safe configuration")).toBeNull();
    expect(screen.getByText("11 destinations")).toBeTruthy();
    expect(screen.getByText("Destination 10")).toBeTruthy();
    expect(screen.queryByText("Destination 11")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(screen.getByText("11 destinations")).toBeTruthy();
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
    expect(screen.queryByText("Kind")).toBeNull();
    expect(screen.queryByText("State")).toBeNull();
  });

  it("uses destination kind assets in the identity column", () => {
    render(
      <VaneIntlProvider locale="en-US">
        <DestinationsSection
          destinations={[
            destinationFixture(1, "generic_webhook"),
            destinationFixture(2, "feishu"),
            destinationFixture(3, "slack"),
            destinationFixture(4, "email"),
          ]}
          routes={[]}
          pending={false}
          onTest={vi.fn<DestinationActionHandler>()}
          onPreview={vi.fn<DestinationActionHandler>()}
          onEdit={vi.fn<DestinationEditHandler>()}
          onToggle={vi.fn<DestinationActionHandler>()}
        />
      </VaneIntlProvider>,
    );

    const images = Array.from(document.querySelectorAll("tbody td:first-child img"));
    const imageSources = images.map((image) => image.getAttribute("src") ?? "");

    expect(imageSources).toContain(webhookIconUrl);
    expect(imageSources).toContain(larkIconUrl);
    expect(imageSources).toContain(slackIconUrl);
    expect(
      screen.getByText("Destination 4").closest("tr")?.querySelector("td:first-child svg"),
    ).toBeTruthy();
  });

  it("renders row actions as icon-only controls with the shared power affordance", () => {
    const onTest = vi.fn<DestinationActionHandler>();
    const onPreview = vi.fn<DestinationActionHandler>();
    const onEdit = vi.fn<DestinationEditHandler>();
    const onToggle = vi.fn<DestinationActionHandler>();
    const destination = destinationFixture(2);

    render(
      <VaneIntlProvider locale="en-US">
        <DestinationsSection
          destinations={[destination]}
          routes={[]}
          pending={false}
          onTest={onTest}
          onPreview={onPreview}
          onEdit={onEdit}
          onToggle={onToggle}
        />
      </VaneIntlProvider>,
    );

    expect(screen.queryByText("Test")).toBeNull();
    expect(screen.queryByText("Preview")).toBeNull();
    expect(screen.queryByText("Disable")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Test Destination 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview Destination 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit destination" }));

    const powerButton = screen.getByRole("button", { name: "Disable destination" });
    fireEvent.click(powerButton);

    expect(onTest).toHaveBeenCalledWith(destination);
    expect(onPreview).toHaveBeenCalledWith(destination);
    expect(onEdit).toHaveBeenCalledWith(destination.id);
    expect(onToggle).toHaveBeenCalledWith(destination);
    expect(powerButton.textContent).toBe("");
    expect(powerButton.getAttribute("class")).toContain("text-destructive");
    expect(powerButton.getAttribute("class")).toContain("drop-shadow");
  });

});

function destinationFixture(
  index: number,
  kind: DestinationSummary["kind"] = index % 2 === 0 ? "feishu" : "generic_webhook",
): DestinationSummary {
  return {
    id: `destination-${index}`,
    name: `Destination ${index}`,
    kind,
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
