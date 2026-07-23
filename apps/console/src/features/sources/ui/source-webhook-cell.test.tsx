// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CopyableCodeLineProps } from "#/components/common/copyable-code-line";
import { SourceWebhookCell } from "#/features/sources/ui/source-webhook-cell";
import { VaneIntlProvider } from "#/i18n/provider";

vi.mock("#/components/common/copyable-code-line", () => ({
  CopyableCodeLine: ({ value, copyValue, copyLabel, tooltipValue }: CopyableCodeLineProps) => (
    <div
      data-testid="copyable-code-line"
      data-value={value}
      data-copy-value={copyValue}
      data-copy-label={copyLabel}
      data-tooltip-value={tooltipValue}
    >
      {value}
    </div>
  ),
}));

vi.mock("#/lib/browser", () => ({
  urlFromCurrentOrigin: (path: string) => `http://localhost${path}`,
}));

describe("source webhook cell", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the short intake path and exposes the full webhook URL for hover and copy", () => {
    render(
      <VaneIntlProvider locale="en-US">
        <SourceWebhookCell sourceId="source-1" />
      </VaneIntlProvider>,
    );

    const codeLine = screen.getByTestId("copyable-code-line");
    const path = "/api/sources/source-1/webhook";
    const url = `http://localhost${path}`;

    expect(codeLine.getAttribute("data-value")).toBe(path);
    expect(codeLine.getAttribute("data-copy-value")).toBe(url);
    expect(codeLine.getAttribute("data-tooltip-value")).toBe(url);
    expect(codeLine.getAttribute("data-copy-label")).toBe("Copy webhook URL");
  });
});
