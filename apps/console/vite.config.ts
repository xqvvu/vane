/// <reference types="vitest/config" />

import fs from "node:fs/promises";
import path from "node:path";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      router: {
        semicolons: true,
        quoteStyle: "double",
        generatedRouteTree: path.join(import.meta.dirname, "src/route-tree.gen.ts"),
      },
      importProtection: {
        behavior: "error",
      },
    }),
    nitro({
      wasm: {
        silent: true,
      },
      hooks: {
        async compiled(nitro) {
          await fs.cp(
            path.join(import.meta.dirname, "src/infra/sqlite/migrations"),
            path.join(nitro.options.output.serverDir, "_ssr/migrations"),
            { recursive: true },
          );
        },
      },
    }),
    viteReact(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],

  build: {
    chunkSizeWarningLimit: 1024,
  },

  server: {
    port: 6180,
    strictPort: true,
    host: true,
  },

  test: {},
});

export default config;
