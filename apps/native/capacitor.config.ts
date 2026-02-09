import { CapacitorConfig } from "@capacitor/cli";
import { APP_ID, getBrandingForEnv } from "@repo/app-config";

const appEnv = process.env.VITE_APP_ENV ?? "prod";
const branding = getBrandingForEnv(appEnv);

const config: CapacitorConfig = {
  appId: APP_ID,
  appName: branding.name,
  webDir: "../web/dist",
  bundledWebRuntime: false,
};

export default config;
