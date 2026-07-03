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
    // Add this for SPA routing support in production builds
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },

  plugins: [react(), expressPlugin()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },

  optimizeDeps: {
    exclude: ["flutterwave-react-v3"],
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only runs in dev — safe for Vercel build
    configureServer(viteServer) {
      const expressApp = createServer();
      viteServer.middlewares.use(expressApp);
      console.log("✅ Express server middleware mounted on Vite dev server");
    },
  };
}