import path from "node:path";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, lazyPlugins } from "vite-plus";

const __dirname = import.meta.dirname;

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@vane/api": path.resolve(__dirname, "../../packages/api/src"),
      "@vane/core": path.resolve(__dirname, "../../packages/core/src"),
      "@vane/destinations/assets": path.resolve(__dirname, "../../packages/destinations/assets"),
      "@vane/destinations": path.resolve(__dirname, "../../packages/destinations/src"),
      "@vane/providers/assets": path.resolve(__dirname, "../../packages/providers/assets"),
      "@vane/providers": path.resolve(__dirname, "../../packages/providers/src"),
    },
  },

  plugins: lazyPlugins(() => [
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

  // Workspace packages resolve to TypeScript source through the aliases above.
  // Keep them bundled into the SSR output instead of being externalized as bare
  // `@vane/*` imports that a production runtime cannot resolve.
  ssr: {
    noExternal: [/^@vane\//],
  },
});

export default config;
