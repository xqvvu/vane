// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { VaneIntlProvider } from "#/i18n/provider.tsx";

import { DestinationPreviewDialog, DestinationTestNoticePanel } from "./destination-notices.tsx";

describe("destination notices", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows rendered payload in the preview dialog", () => {
    render(
      <VaneIntlProvider locale="en-US">
        <DestinationPreviewDialog
          open
          onOpenChange={() => {}}
          notice={{
            destination: {
              id: "destination-1",
              name: "Ops Slack",
              kind: "slack",
              enabled: true,
            },
            renderedPayload: {
              text: "disk full",
              labels: {
                service: "api",
              },
            },
          }}
        />
      </VaneIntlProvider>,
    );

    expect(screen.getByText(/"text": "disk full"/)).toBeTruthy();
    expect(screen.getByText(/"service": "api"/)).toBeTruthy();
  });

  it("shows response bodies without requiring syntax highlighting", () => {
    render(
      <VaneIntlProvider locale="en-US">
        <DestinationTestNoticePanel
          notice={{
            success: false,
            destination: {
              id: "destination-1",
              name: "Ops Webhook",
              kind: "generic_webhook",
              enabled: true,
            },
            statusCode: 502,
            error: "Downstream rejected the request",
            responseBody: "bad gateway token=[REDACTED]",
          }}
        />
      </VaneIntlProvider>,
    );

    expect(screen.getByText("Downstream rejected the request")).toBeTruthy();
    expect(screen.getByText("bad gateway token=[REDACTED]")).toBeTruthy();
  });
});
