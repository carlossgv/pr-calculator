/* FILE: apps/web/vite.config.ts */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { getBrandingForEnv } from "@repo/app-config";

export default defineConfig(() => {
  const appEnv = process.env.VITE_APP_ENV ?? "prod"; // "prod" | "dev"
  const isNative = process.env.VITE_PLATFORM === "native";
  const branding = getBrandingForEnv(appEnv);

  return {
    base: isNative ? "./" : "/",

    plugins: [
      react(),
      ...(isNative
        ? []
        : [
            VitePWA({
              registerType: "autoUpdate",
              manifest: {
                name: branding.name,
                short_name: branding.shortName,
                description: branding.description,
                start_url: "/",
                scope: "/",
                display: "standalone",
                theme_color: branding.themeColor,
                background_color: branding.backgroundColor,
                icons: [
                  { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
                  { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
                ],
              },
            }),
          ]),
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
