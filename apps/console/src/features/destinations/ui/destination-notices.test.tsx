// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VaneIntlProvider } from "#/i18n/provider.tsx";

import { DestinationPreviewDialog, showDestinationTestToast } from "./destination-notices.tsx";

const testState = vi.hoisted(() => ({
  toast: {
    error: vi.fn<(title: string, options?: { description?: ReactNode }) => void>(),
    success: vi.fn<(title: string, options?: { description?: ReactNode }) => void>(),
  },
}));

vi.mock("sonner", () => ({
  toast: testState.toast,
}));

describe("destination notices", () => {
  afterEach(() => {
    cleanup();
    testState.toast.error.mockClear();
    testState.toast.success.mockClear();
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

  it("shows destination test response bodies in a toast", () => {
    const t = ((key: string, values?: Record<string, unknown>) => {
      if (key === "destinations.notice.testFailedTitle") {
        return `Test ${String(values?.name)}: failed`;
      }

      if (key === "destinations.notice.testRejected") {
        return "Destination sender rejected the test";
      }

      return key;
    }) as Parameters<typeof showDestinationTestToast>[1];

    showDestinationTestToast(
      {
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
      },
      t,
    );

    expect(testState.toast.error).toHaveBeenCalledWith(
      "Test Ops Webhook: failed",
      expect.objectContaining({
        description: expect.any(Object),
      }),
    );

    const description = testState.toast.error.mock.calls[0]?.[1]?.description;
    render(<>{description}</>);

    expect(screen.getByText("Downstream rejected the request")).toBeTruthy();
    expect(screen.getByText("bad gateway token=[REDACTED]")).toBeTruthy();
  });
});
