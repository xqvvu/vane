import { describe, expect, it } from "vite-plus/test";

import {
  feishuAppCreateCommandFromValues,
  feishuAppFormValuesFromApp,
  feishuAppUpdateCommandFromValues,
} from "#/features/integrations/model/feishu-app-form";

describe("feishu app form model", () => {
  it("trims create values", () => {
    expect(
      feishuAppCreateCommandFromValues({
        name: "  SRE pager  ",
        appId: "  cli_sre ",
        appSecret: "secret-1",
      }),
    ).toEqual({ name: "SRE pager", appId: "cli_sre", appSecret: "secret-1" });
  });

  it("starts the edit form with an empty secret", () => {
    expect(
      feishuAppFormValuesFromApp({
        id: "app-1",
        name: "SRE pager",
        appId: "cli_sre",
        createdAt: "2026-10-08T10:00:00.000Z",
        updatedAt: "2026-10-08T10:00:00.000Z",
      }),
    ).toEqual({ name: "SRE pager", appId: "cli_sre", appSecret: "" });
  });

  it("omits an empty secret on update so the stored one is preserved", () => {
    const command = feishuAppUpdateCommandFromValues("app-1", {
      name: "SRE pager",
      appId: "cli_sre",
      appSecret: "",
    });

    expect(command).toEqual({ id: "app-1", name: "SRE pager", appId: "cli_sre" });
    expect(command).not.toHaveProperty("appSecret", expect.anything());
    expect("appSecret" in command && command.appSecret === undefined).toBe(true);
  });

  it("includes a provided secret on update", () => {
    expect(
      feishuAppUpdateCommandFromValues("app-1", {
        name: "SRE pager",
        appId: "cli_sre",
        appSecret: "secret-2",
      }),
    ).toEqual({ id: "app-1", name: "SRE pager", appId: "cli_sre", appSecret: "secret-2" });
  });
});
