import { CapacitorConfig } from "@capacitor/cli";
import { APP_ID, getBrandingForEnv } from "@repo/app-config";

const appEnv = process.env.VITE_APP_ENV ?? "prod";
const branding = getBrandingForEnv(appEnv);
const liveUpdateAppId = process.env.CAPAWESOME_APP_ID ?? "REPLACE_ME";
const liveUpdateChannel = process.env.CAPAWESOME_CHANNEL ?? "production";

const config: CapacitorConfig = {
  appId: APP_ID,
  appName: branding.name,
  webDir: "../web/dist",
  bundledWebRuntime: false,
  plugins: {
    LiveUpdate: {
      appId: liveUpdateAppId,
      defaultChannel: liveUpdateChannel,
      autoUpdateStrategy: "background",
      autoBlockRolledBackBundles: true,
      readyTimeout: 10000,
    },
  },
};

export default config;
