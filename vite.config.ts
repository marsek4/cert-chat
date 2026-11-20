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
  // server: {
  //   port: 5174, // Vite работает тут
  //   proxy: {
  //     // Если вдруг будете делать fetch('/api/...') из React, это перенаправит запрос в Nginx
  //     "/api": {
  //       target: "https://localhost:5173",
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
  // server: {
  //   port: 5174,
  //   proxy: {
  //     "/api": {
  //       target: "https://10.67.0.73:8443",
  //       changeOrigin: true,
  //       secure: false, // игнорируем самоподписанный сертификат бэкенда
  //     },
  //     "/ws": {
  //       target: "wss://10.67.0.73:8443",
  //       ws: true,
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
  server: {
    port: 5174,
    host: "127.0.0.1",
    allowedHosts: ["corp-chat.ctflab.local", "localhost"], // ← Добавьте эту строку
  },
});
