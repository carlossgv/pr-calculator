import { DarkTheme, DefaultTheme } from "@react-navigation/native";

export type CustomColors = {
  background: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  highlight: string;
  error: string;
  warning: string;
  success: string;
  surface: string;
  borders: string;
  lightGrey: string;
  onPrimaryText: string;
};

export type CustomTheme = typeof DefaultTheme & {
  colors: CustomColors; // Override the colors type with CustomColors
};

export const CustomDarkTheme: CustomTheme = {
  ...DefaultTheme, // Include all properties from DefaultTheme, such as fonts
  dark: true, // Set dark mode
  colors: {
    ...DarkTheme.colors, // Include default colors
    background: "#1E1E2F", // Dark Greyish Blue
    primary: "#7209B7", // Light Greyish White
    primaryText: "#E1E1E6", // Light Greyish White
    secondaryText: "#A6A6B3", // Muted Grey
    accent: "#3F37C9",
    highlight: "#5BC0BE", // Soft Teal
    error: "#E63946", // Muted Red
    warning: "#F4A261", // Soft Orange
    success: "#4CAF50", // Muted Green
    surface: "#2B2B3B", // Darker Grey
    borders: "#3A3A4A", // Dark Grey
    lightGrey: "#F5F5F5", // Light Grey
    onPrimaryText: "#E1E1E6", // Light Greyish White
  },
};

export const CustomLightTheme: CustomTheme = {
  ...DefaultTheme, // Include all properties from DefaultTheme, such as fonts
  dark: false, // Set light mode
  colors: {
    ...DefaultTheme.colors, // Include default colors
    background: "#F5F5F5", // Light Grey
    primary: "#7209B7", // Light Greyish White
    primaryText: "#1E1E2F", // Dark Greyish Blue
    secondaryText: "#4B4B6D", // Muted Grey
    // accent: "#F72585",
    accent: "#847FF7",

    highlight: "#5BC0BE", // Soft Teal
    error: "#E63946", // Muted Red
    warning: "#F4A261", // Soft Orange
    success: "#4CAF50", // Muted Green
    surface: "#FFFFFF", // White
    borders: "#D1D1D6", // Light Grey
    lightGrey: "#E1E1E6", // Light Greyish White
    onPrimaryText: "#E1E1E6", // Light Greyish White
  },
};
