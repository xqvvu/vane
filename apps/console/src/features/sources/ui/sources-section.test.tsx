// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SourceSummary } from "#/features/sources/ui/source-ui-types.ts";
import { SourcesSection } from "#/features/sources/ui/sources-section.tsx";
import { VaneIntlProvider } from "#/i18n/provider.tsx";

type RouteSummary = ComponentProps<typeof SourcesSection>["routes"][number];
type SourceActionHandler = (source: SourceSummary) => void;
type SourceEditHandler = (sourceId: string) => void;

vi.mock("#/lib/browser.ts", () => ({
  copyText: vi.fn<() => Promise<boolean>>(async () => true),
  urlFromCurrentOrigin: (path: string) => `http://localhost${path}`,
}));

describe("sources section table", () => {
  afterEach(() => {
    cleanup();
  });

  it("paginates sources inside the table panel", () => {
    const sources = Array.from({ length: 12 }, (_, index) => sourceFixture(index + 1));

    render(
      <VaneIntlProvider locale="en-US">
        <SourcesSection
          sources={sources}
          routes={[]}
          pending={false}
          onEdit={vi.fn<SourceEditHandler>()}
          onToggle={vi.fn<SourceActionHandler>()}
          onRotateToken={vi.fn<SourceActionHandler>()}
          onDelete={vi.fn<SourceActionHandler>()}
        />
      </VaneIntlProvider>,
    );

    expect(screen.getByText("12 sources")).toBeTruthy();
    expect(screen.getByText("Source 10")).toBeTruthy();
    expect(screen.queryByText("Source 11")).toBeNull();

    expect(screen.getByRole("button", { name: "1" }).getAttribute("aria-current")).toBe("page");

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(screen.getByText("12 sources")).toBeTruthy();
    expect(screen.getByText("Source 11")).toBeTruthy();
    expect(screen.getByText("Source 12")).toBeTruthy();
    expect(screen.queryByText("Source 10")).toBeNull();
    expect(screen.getByRole("button", { name: "2" }).getAttribute("aria-current")).toBe("page");
  });

  it("summarizes enabled route coverage instead of static auth placeholders", () => {
    render(
      <VaneIntlProvider locale="en-US">
        <SourcesSection
          sources={[sourceFixture(1), sourceFixture(2)]}
          routes={[
            routeFixture("direct-route", "Direct route", ["source-1"], true),
            routeFixture("catch-all-route", "Catch all route", [], true),
            routeFixture("disabled-route", "Disabled route", ["source-1"], false),
          ]}
          pending={false}
          onEdit={vi.fn<SourceEditHandler>()}
          onToggle={vi.fn<SourceActionHandler>()}
          onRotateToken={vi.fn<SourceActionHandler>()}
          onDelete={vi.fn<SourceActionHandler>()}
        />
      </VaneIntlProvider>,
    );

    expect(screen.getByText("Intake")).toBeTruthy();
    expect(screen.getByText("Routes")).toBeTruthy();
    expect(screen.queryByText("Auth")).toBeNull();
    expect(screen.queryByText("Last received")).toBeNull();
    expect(screen.queryByText("Token configured")).toBeNull();
    expect(screen.getByText("2 active")).toBeTruthy();
    expect(screen.getByText("1 active")).toBeTruthy();
  });
});

function sourceFixture(index: number): SourceSummary {
  return {
    id: `source-${index}`,
    name: `Source ${index}`,
    provider: "generic",
    enabled: index % 2 === 0,
  };
}

function routeFixture(
  id: string,
  name: string,
  sourceIds: string[],
  enabled: boolean,
): RouteSummary {
  return {
    id,
    name,
    enabled,
    rule: {
      sourceIds,
      severities: [],
      statuses: [],
      labels: [],
      titleContains: [],
      messageContains: [],
    },
    destinationIds: ["destination-1"],
  };
}
