import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ciWorkflowPath = resolve(workspaceRoot, ".github/workflows/ci.yml");
const packageJsonPath = resolve(workspaceRoot, "package.json");
const nodeVersionPath = resolve(workspaceRoot, ".node-version");

function readCiWorkflow(): string {
  return readFileSync(ciWorkflowPath, "utf8");
}

describe("root CI workflow contract", () => {
  it("declares the RC quality gates for the monorepo", () => {
    const workflow = readCiWorkflow();

    expect(workflow).toMatch(/^\s*name:\s*CI\s*$/m);
    expect(workflow).toMatch(/^\s*on:\s*$/m);
    expect(workflow).toMatch(/push:/);
    expect(workflow).toMatch(/pull_request:/);

    // Accept both inline and YAML multi-line block
    expect(workflow).toMatch(
      /(?:^\s*(?:-\s*)?run:\s*vp install --frozen-lockfile\s*$|vp install --frozen-lockfile)/m,
    );

    expect(workflow).toMatch(/vp check/);
    expect(workflow).toMatch(/vp run -r test/);
    expect(workflow).toMatch(/vp run -r build/);
  });

  it("pins the Vite+ toolchain and the Node runtime", () => {
    const workflow = readCiWorkflow();

    expect(workflow).toMatch(/uses:\s*voidzero-dev\/setup-vp@v\d+\.\d+\.\d+/);
    expect(workflow).not.toMatch(/uses:\s*voidzero-dev\/setup-vp@v\d+\s*$/m);

    expect(workflow).toMatch(/node-version-file:\s*"\.node-version"/);
    expect(readFileSync(nodeVersionPath, "utf8").trim()).toMatch(/^\d+\.\d+\.\d+$/);

    expect(workflow).not.toMatch(/pnpm\/action-setup/);
    expect(workflow).not.toMatch(/actions\/setup-node/);
    expect(workflow).not.toMatch(/pnpm install/);
    expect(workflow).not.toMatch(/pnpm -r/);
  });

  it("routes the root scripts through the vp CLI", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      packageManager?: string;
      scripts?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.packageManager).toMatch(/^pnpm@\d+\./);
    expect(packageJson.devDependencies?.["vite-plus"]).toBe("catalog:");
    expect(packageJson.scripts?.test).toBe("vp run -r test");
    expect(packageJson.scripts?.build).toBe("vp run -r build");
    expect(packageJson.scripts?.ready).toBe("vp check && vp run -r test && vp run -r build");
  });
});
