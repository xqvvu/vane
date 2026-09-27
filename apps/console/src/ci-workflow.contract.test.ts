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

    // Install must be reproducible against the committed lockfile.
    expect(workflow).toMatch(/^\s*(?:-\s*)?run:\s*vp install --frozen-lockfile\s*$/m);

    // The RC quality gates: check (fmt + lint + types), test, build.
    expect(workflow).toMatch(/^\s*(?:-\s*)?run:\s*vp check\s*$/m);
    expect(workflow).toMatch(/^\s*(?:-\s*)?run:\s*vp run -r test\s*$/m);
    expect(workflow).toMatch(/^\s*(?:-\s*)?run:\s*vp run -r build\s*$/m);
  });

  it("pins the Vite+ toolchain and the Node runtime", () => {
    const workflow = readCiWorkflow();

    // setup-vp installs Node, the package manager, and the Vite+ toolchain.
    // The action must be pinned to an exact release: the floating `v1` tag
    // moves on to unreleased versions.
    expect(workflow).toMatch(/uses:\s*voidzero-dev\/setup-vp@v\d+\.\d+\.\d+/);
    expect(workflow).not.toMatch(/uses:\s*voidzero-dev\/setup-vp@v\d+\s*$/m);

    // Node comes from the committed .node-version rather than a shell pin.
    expect(workflow).toMatch(/node-version-file:\s*"\.node-version"/);
    expect(readFileSync(nodeVersionPath, "utf8").trim()).toMatch(/^\d+\.\d+\.\d+$/);

    // The pnpm action-setup and setup-node steps are gone: setup-vp owns the
    // package manager, so a second pinned pnpm version can no longer drift
    // from package.json.
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
    expect(packageJson.devDependencies?.["vite-plus"]).toBe("catalog:toolchain");
    expect(packageJson.scripts?.test).toBe("vp run -r test");
    expect(packageJson.scripts?.build).toBe("vp run -r build");
    expect(packageJson.scripts?.ready).toBe("vp check && vp run -r test && vp run -r build");
  });
});
