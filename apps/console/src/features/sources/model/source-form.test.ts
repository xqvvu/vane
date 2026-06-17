import { describe, expect, it } from "vitest";

import {
  formSourceProvider,
  formSourceProviderValue,
  sourceConfigFromForm,
  sourceConfigPatchFromForm,
} from "#/features/sources/model/source-form.ts";

describe("source form helpers", () => {
  it("maps supported provider values from form data", () => {
    const data = new FormData();

    data.set("provider", "grafana");

    expect(formSourceProvider(data)).toBe("grafana");
    expect(formSourceProviderValue("signoz")).toBe("signoz");
    expect(formSourceProviderValue("uptime_kuma")).toBe("uptime_kuma");
    expect(formSourceProviderValue("alertmanager")).toBe("alertmanager");
  });

  it("falls back unknown provider values to generic", () => {
    const data = new FormData();

    data.set("provider", "unsupported");

    expect(formSourceProvider(data)).toBe("generic");
    expect(formSourceProviderValue(null)).toBe("generic");
  });

  it("maps optional additional shared secrets into source config", () => {
    const data = new FormData();

    data.set("signingSecret", " shared-secret ");

    expect(sourceConfigFromForm(data)).toEqual({ signingSecret: "shared-secret" });
    expect(sourceConfigPatchFromForm(data)).toEqual({ signingSecret: "shared-secret" });
  });

  it("omits empty additional shared secret patches", () => {
    const data = new FormData();

    data.set("signingSecret", "");

    expect(sourceConfigFromForm(data)).toEqual({});
    expect(sourceConfigPatchFromForm(data)).toBeUndefined();
  });
});
