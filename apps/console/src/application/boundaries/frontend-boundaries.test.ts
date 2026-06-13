import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const srcDir = path.resolve(import.meta.dirname, "../..");
const scannedRoots = ["routes", "features", "shell", "components/ui"];
const forbiddenImports = [
  "#/infra/",
  "#/application/runtime/container.ts",
  "#/application/runtime/request-context.ts",
  "#/lib/auth.server.ts",
];

describe("frontend import boundaries", () => {
  it("keeps client-safe routes, feature UI/model/query files, shell, and ui primitives away from server-only infrastructure", () => {
    const violations: string[] = [];

    for (const filePath of frontendSafeFiles()) {
      const source = readFileSync(filePath, "utf8");

      for (const forbidden of forbiddenImports) {
        if (source.includes(forbidden)) {
          violations.push(`${relative(filePath)} imports ${forbidden}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps server functions behind feature api files rather than feature ui/model modules", () => {
    const violations: string[] = [];

    for (const filePath of filesUnder("features")) {
      if (!isTypeScriptSource(filePath) || relative(filePath).includes("/api/")) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");

      if (source.includes("@tanstack/react-start") || source.includes("#/application/")) {
        violations.push(relative(filePath));
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps browser globals behind explicit browser adapters", () => {
    const violations: string[] = [];
    const browserGlobalPatterns = [
      /\bwindow\./,
      /\bnavigator\./,
      /typeof window/,
      /typeof navigator/,
    ];

    for (const filePath of frontendSafeFiles()) {
      if (relative(filePath) === "lib/browser.ts") {
        continue;
      }

      const source = readFileSync(filePath, "utf8");

      for (const pattern of browserGlobalPatterns) {
        if (pattern.test(source)) {
          violations.push(`${relative(filePath)} uses ${pattern}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

function frontendSafeFiles(): string[] {
  return scannedRoots.flatMap((root) =>
    filesUnder(root).filter((filePath) => {
      const relativePath = relative(filePath);

      if (!isTypeScriptSource(filePath)) {
        return false;
      }

      if (relativePath.startsWith("routes/api/")) {
        return false;
      }

      if (relativePath.includes(".server.")) {
        return false;
      }

      return true;
    }),
  );
}

function filesUnder(root: string): string[] {
  const rootPath = path.join(srcDir, root);
  const entries = readdirSync(rootPath);
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry);
    const stat = statSync(entryPath);

    if (stat.isDirectory()) {
      files.push(...filesUnder(path.join(root, entry)));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

function isTypeScriptSource(filePath: string): boolean {
  return filePath.endsWith(".ts") || filePath.endsWith(".tsx");
}

function relative(filePath: string): string {
  return path.relative(srcDir, filePath);
}
