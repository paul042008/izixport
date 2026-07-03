import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared", "."],
      deny: [".env", ".env.*", "*.{crt,pem,key}", "**/.git/**", "server/**", "dist/**"],
    },
  },

  build: {
    outDir: "dist/spa",
    sourcemap: mode === "development",
  },

  plugins: [react(), expressPlugin()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },

  // Better handling for third-party packages with old TypeScript configs
  optimizeDeps: {
    exclude: ["flutterwave-react-v3"], // Prevent issues with old package
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(viteServer) {
      const expressApp = createServer();

      // Mount Express app as middleware
      viteServer.middlewares.use(expressApp);

      console.log("✅ Express server middleware mounted on Vite dev server");
    },
  };
}