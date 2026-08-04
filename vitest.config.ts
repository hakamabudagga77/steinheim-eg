import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "load-tests/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Next.js resolves `server-only` itself; it isn't an installed package,
      // so point Vitest at a no-op stub (see vitest.server-only-stub.ts).
      "server-only": path.resolve(__dirname, "vitest.server-only-stub.ts"),
    },
  },
});
