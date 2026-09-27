import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ciWorkflowPath = resolve(workspaceRoot, ".github/workflows/ci.yml");
const packageJsonPath = resolve(workspaceRoot, "package.json");

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

    // pnpm/action-setup must defer to package.json packageManager. Pinning a
    // second version here aborts the action with "Multiple versions of pnpm
    // specified" as soon as the two drift apart.
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    expect(packageJson.packageManager).toMatch(/^pnpm@\d+\./);

    const pnpmSetupStep = workflow.slice(
      workflow.indexOf("Setup pnpm"),
      workflow.indexOf("Setup Node.js"),
    );
    expect(pnpmSetupStep).toMatch(/uses:\s*pnpm\/action-setup@/);
    expect(pnpmSetupStep).not.toMatch(/^\s*version:/m);
  });
});
