import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "/src"),
      "@components": path.resolve(__dirname, "/src/components"),
      "@socket-utils": path.resolve(__dirname, "/src/socket-utils"),
      "@rest-queries": path.resolve(__dirname, "/src/rest-queries"),
    },
  },
  server: {
    port: 5174,
    host: "127.0.0.1",
    allowedHosts: ["corp-chat.ctflab.local", "localhost"],
  },
});
