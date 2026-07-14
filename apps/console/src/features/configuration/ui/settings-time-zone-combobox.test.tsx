// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsTimeZoneCombobox } from "#/features/configuration/ui/settings-time-zone-combobox.tsx";
import { VaneIntlProvider } from "#/i18n/provider.tsx";

describe("settings time zone combobox", () => {
  afterEach(cleanup);

  it("limits rendered options and defers filtering to matching time zones", async () => {
    const onChange = vi.fn<(value: string) => void>();

    render(
      <VaneIntlProvider locale="en-US">
        <label htmlFor="time-zone">Time zone</label>
        <SettingsTimeZoneCombobox
          id="time-zone"
          invalid={false}
          value="UTC"
          onBlur={vi.fn<() => void>()}
          onChange={onChange}
        />
      </VaneIntlProvider>,
    );

    const input = screen.getByRole("combobox", { name: "Time zone" });

    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getAllByRole("option").length).toBeLessThanOrEqual(60);
    });

    fireEvent.change(input, { target: { value: "Shanghai" } });
    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(1);
    });

    fireEvent.click(screen.getByRole("option", { name: "Asia/Shanghai" }));
    expect(onChange).toHaveBeenCalledWith("Asia/Shanghai");
  });
});
