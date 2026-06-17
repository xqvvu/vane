/// <reference types="vitest/config" />

import path from "node:path";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
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
    viteReact(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],

  server: {
    port: 6180,
    strictPort: true,
    host: true,
  },

  test: {},
});

export default config;
