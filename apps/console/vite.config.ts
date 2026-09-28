import path from "node:path";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, lazyPlugins } from "vite-plus";

const config = defineConfig((env) => {
  const isTest = env.mode === "test";

  // `vp test` runs with mode=test. TanStack Start, nitro, and devtools assume a
  // real app build (they externalize React and spin up extra Vite servers), so
  // they stay out of test runs. tailwind/react/babel match the previous vitest
  // config, and plugin order is preserved for dev and build.
  return {
    resolve: {
      tsconfigPaths: true,
    },

    plugins: lazyPlugins(() => [
      !isTest && devtools(),
      tailwindcss(),
      !isTest &&
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
      !isTest &&
        nitro({
          wasm: {
            silent: true,
          },
        }),
      viteReact(),
      babel({
        presets: [reactCompilerPreset()],
      }),
    ]),

    build: {
      chunkSizeWarningLimit: 1024,
    },

    server: {
      port: 6180,
      strictPort: true,
      host: true,
    },
  };
});

export default config;
