import { resolve } from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: { port: 3000 },
  resolve: {
    alias: {
      // Virtual server-build loads /app/routes/*; ensure it resolves to ./app (Docker root /app)
      "/app": resolve(process.cwd(), "app"),
    },
  },
});
