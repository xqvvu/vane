/// <reference types="vitest/config" />

import path from "node:path";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig(({ mode }) => {
  const isTest = mode === "test";

  return {
    resolve: {
      tsconfigPaths: true,
    },

    plugins: [
      isTest ? false : devtools(),
      tailwindcss(),
      isTest
        ? false
        : tanstackStart({
            router: {
              semicolons: true,
              quoteStyle: "double",
              generatedRouteTree: path.join(import.meta.dirname, "src/route-tree.gen.ts"),
            },
            importProtection: {
              behavior: "error",
            },
          }),
      isTest
        ? false
        : nitro({
            wasm: {
              silent: true,
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
  };
});

export default config;
