// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createDestinationDefaults,
  DestinationForm,
} from "#/features/destinations/ui/destination-form.tsx";
import { VaneIntlProvider } from "#/i18n/provider.tsx";

describe("destination form", () => {
  afterEach(() => {
    cleanup();
  });

  it("switches Feishu templates between text and card modes", () => {
    renderDestinationForm({ kind: "feishu" });

    expect(screen.getByText("Available variables")).toBeTruthy();
    expect(screen.getByLabelText("Message template")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Feishu card" }));

    expect(screen.getByLabelText("Feishu card JSON")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Restore default card" })).toBeTruthy();
  });

  it("inserts template variables into the active template field", () => {
    renderDestinationForm({ kind: "feishu" });

    fireEvent.click(screen.getByRole("button", { name: "event.title" }));

    expect((screen.getByLabelText("Message template") as HTMLTextAreaElement).value).toBe(
      "{{event.title}}",
    );

    fireEvent.click(screen.getByRole("button", { name: "Feishu card" }));
    fireEvent.change(screen.getByLabelText("Feishu card JSON"), {
      target: {
        value: '{"content": "base"}',
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "source.name" }));

    expect((screen.getByLabelText("Feishu card JSON") as HTMLTextAreaElement).value).toBe(
      '{"content": "base"} {{source.name}}',
    );
  });

  it("restores the default Feishu card template", () => {
    renderDestinationForm({ kind: "feishu" });

    fireEvent.click(screen.getByRole("button", { name: "Feishu card" }));
    fireEvent.change(screen.getByLabelText("Feishu card JSON"), {
      target: {
        value: '{"content": "custom"}',
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restore default card" }));

    expect((screen.getByLabelText("Feishu card JSON") as HTMLTextAreaElement).value).toContain(
      "[{{event.severity}}] {{event.title}}",
    );
  });
});

function renderDestinationForm(
  overrides: Partial<ReturnType<typeof createDestinationDefaults>> = {},
) {
  render(
    <VaneIntlProvider locale="en-US">
      <DestinationForm
        mode="create"
        pending={false}
        defaultValues={{
          ...createDestinationDefaults(),
          ...overrides,
        }}
        onPreview={vi.fn<() => unknown>()}
        onSubmit={vi.fn<() => unknown>()}
      />
    </VaneIntlProvider>,
  );
}
