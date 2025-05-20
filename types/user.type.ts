export type User = {
  gender: "M" | "F";
  preferences: {
    weightUnit: 'kg' | 'lb';
    theme: 'light' | 'dark';
  }
}
