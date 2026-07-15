// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createDefaultDestinationRegistry } from "@vane/destinations";

import {
  createDestinationDefaults,
  DestinationForm,
} from "#/features/destinations/ui/destination-form.tsx";
import type {
  DestinationCatalog,
  DestinationFormPreviewInput,
} from "#/features/destinations/ui/destination-ui-types.ts";
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
    expect(cardTemplate).toContain("Alert summary");
    expect(cardTemplate).not.toContain("{{event.labels.service}}");
    expect(cardTemplate).not.toContain("{{event.labels.environment}}");
    expect(cardTemplate).toContain("{{bindings.statusColor}}");
  });

  it("applies dynamic status colors to a saved fixed-color card", () => {
    renderDestinationForm({
      kind: "feishu",
      templateMode: "feishu_card",
      templateColorEnabled: false,
      templateBindings: "{}",
      templateCard: JSON.stringify({
        header: {
          template: "red",
          text_tag_list: [
            {
              text: { content: "{{event.status}}" },
              color: "orange",
            },
          ],
        },
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: "Apply dynamic status colors" }));

    const cardTemplate = (screen.getByLabelText("Feishu card JSON") as HTMLTextAreaElement).value;

    expect(cardTemplate).toContain('"template": "{{bindings.statusColor}}"');
    expect(cardTemplate).toContain('"color": "{{bindings.statusColor}}"');
    expect(screen.getByText("Dynamic card color")).toBeTruthy();
  });

  it("previews the selected resolved status", async () => {
    const onPreview = vi.fn<(input: DestinationFormPreviewInput) => unknown>();

    renderDestinationForm(
      {
        name: "Feishu SRE",
        kind: "feishu",
        webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
        templateMode: "feishu_card",
      },
      { onPreview },
    );

    fireEvent.click(screen.getByRole("button", { name: "Resolved" }));
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() => {
      expect(onPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          sampleStatus: "resolved",
          config: expect.objectContaining({
            template: expect.objectContaining({
              bindings: expect.objectContaining({
                statusColor: expect.objectContaining({
                  select: "event.status",
                }),
              }),
            }),
          }),
        }),
      );
    });
  });
});

function renderDestinationForm(
  overrides: Partial<ReturnType<typeof createDestinationDefaults>> = {},
  options: {
    destinationCatalog?: DestinationCatalog;
    onPreview?: (input: DestinationFormPreviewInput) => unknown;
  } = {},
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
        onPreview={options.onPreview ?? vi.fn<() => unknown>()}
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
