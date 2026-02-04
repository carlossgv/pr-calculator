// apps/web/src/utils/app-env.ts
export const APP_ENV = import.meta.env.VITE_APP_ENV ?? "prod"; // "prod" | "dev"
export const IS_DEV_APP = APP_ENV === "dev";
export const IS_NATIVE_APP = import.meta.env.VITE_PLATFORM === "native";

export function appTitle(base: string) {
  return IS_DEV_APP ? `${base} (DEV)` : base;
}
