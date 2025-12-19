/* FILE: apps/web/vite.config.ts */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  const appEnv = process.env.VITE_APP_ENV ?? "prod"; // "prod" | "dev"
  const isDev = appEnv === "dev";

  const appName = isDev ? "PR Calculator Dev" : "PR Calculator";
  const appShort = isDev ? "PR Calc - Dev" : "PR Calc";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: appName,
          short_name: appShort,
          description: isDev ? "PR Calculator (staging/dev)" : "PR Calculator",
          start_url: "/",
          scope: "/",
          display: "standalone",
          theme_color: isDev ? "#7c3aed" : "#2563eb",
          background_color: "#0b1220",
          icons: [
            { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
          ],
        },
      }),
    ],

    // 👇 clave
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
