// packages/app-config/src/index.ts
export const APP_ID = "dev.carlosgv.prcalculator";

export const APP_BRANDING = {
  name: "PR Calculator",
  shortName: "PR Calc",
  description: "PR Calculator",
  themeColor: "#2563eb",
  backgroundColor: "#0b1220",
};

export type AppBranding = typeof APP_BRANDING;

export function getBrandingForEnv(appEnv?: string): AppBranding & {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
} {
  const isDev = appEnv === "dev";
  return {
    ...APP_BRANDING,
    name: isDev ? `${APP_BRANDING.name} Dev` : APP_BRANDING.name,
    shortName: isDev ? `${APP_BRANDING.shortName} - Dev` : APP_BRANDING.shortName,
    description: isDev
      ? `${APP_BRANDING.description} (staging/dev)`
      : APP_BRANDING.description,
    themeColor: isDev ? "#7c3aed" : APP_BRANDING.themeColor,
  };
}
