import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ciWorkflowPath = resolve(workspaceRoot, ".github/workflows/ci.yml");

describe("root CI workflow contract", () => {
  it("declares the RC quality gates for the monorepo", () => {
    const workflow = readFileSync(ciWorkflowPath, "utf8");

    expect(workflow).toMatch(/^\s*name:\s*CI\s*$/m);
    expect(workflow).toMatch(/^\s*on:\s*$/m);
    expect(workflow).toMatch(/push:/);
    expect(workflow).toMatch(/pull_request:/);

    // Install must be reproducible against the committed lockfile.
    expect(workflow).toMatch(/pnpm install --frozen-lockfile/);

    // RC checklist §A: fmt-check, lint, test, console build.
    expect(workflow).toMatch(/pnpm -r --if-present fmt:check/);
    expect(workflow).toMatch(/pnpm -r --if-present lint/);
    expect(workflow).toMatch(/pnpm -r --if-present test/);
    expect(workflow).toMatch(/pnpm --filter @vane\/console build/);

    // Runtime pins that match package.json engines / packageManager.
    expect(workflow).toMatch(/node-version:\s*24\b/);
    expect(workflow).toMatch(/version:\s*11\.15\.1/);
  });
});
