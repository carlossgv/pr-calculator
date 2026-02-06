export const APP_ID: string;

export const APP_BRANDING: {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
};

export type AppBranding = typeof APP_BRANDING;

export function getBrandingForEnv(
  appEnv?: string,
): AppBranding & {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
};
