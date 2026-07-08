import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  plugins: [
    tailwindcss(),
    viteReact(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
});
