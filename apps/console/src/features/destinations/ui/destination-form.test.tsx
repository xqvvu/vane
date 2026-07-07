// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultDestinationRegistry } from "@vane/destinations";

import {
  createDestinationDefaults,
  DestinationForm,
} from "#/features/destinations/ui/destination-form.tsx";
import type { DestinationCatalog } from "#/features/destinations/ui/destination-ui-types.ts";
import { VaneIntlProvider } from "#/i18n/provider.tsx";

const defaultDestinationCatalog = createDefaultDestinationRegistry().toCatalog();

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

  it("shows Feishu card JSON configuration help", () => {
    renderDestinationForm({ kind: "feishu" });

    fireEvent.click(screen.getByRole("button", { name: "Feishu card" }));

    expect(screen.getByRole("button", { name: "How to configure Feishu card JSON" })).toBeTruthy();
  });

  it("hides Feishu card JSON configuration help when disabled by manifest", () => {
    renderDestinationForm(
      { kind: "feishu" },
      { destinationCatalog: destinationCatalogWithHiddenFeishuCardHelp() },
    );

    fireEvent.click(screen.getByRole("button", { name: "Feishu card" }));

    expect(screen.queryByRole("button", { name: "How to configure Feishu card JSON" })).toBeNull();
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

    const cardTemplate = (screen.getByLabelText("Feishu card JSON") as HTMLTextAreaElement).value;

    expect(cardTemplate).toContain('"schema": "2.0"');
    expect(cardTemplate).toContain("告警摘要");
    expect(cardTemplate).toContain("{{event.labels.service}}");
  });
});

function renderDestinationForm(
  overrides: Partial<ReturnType<typeof createDestinationDefaults>> = {},
  options: { destinationCatalog?: DestinationCatalog } = {},
) {
  render(
    <VaneIntlProvider locale="en-US">
      <DestinationForm
        mode="create"
        pending={false}
        destinationCatalog={options.destinationCatalog ?? defaultDestinationCatalog}
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

function destinationCatalogWithHiddenFeishuCardHelp(): DestinationCatalog {
  return defaultDestinationCatalog.map((item) =>
    item.kind === "feishu"
      ? {
          ...item,
          configFields: item.configFields.map((field) =>
            field.type === "template"
              ? {
                  ...field,
                  modes: field.modes?.map((mode) =>
                    mode.mode === "feishu_card" && mode.help
                      ? {
                          ...mode,
                          help: {
                            ...mode.help,
                            show: false,
                          },
                        }
                      : mode,
                  ),
                }
              : field,
          ),
        }
      : item,
  );
}
