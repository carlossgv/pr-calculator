import { Stack } from "expo-router";

export default function HomeLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="pr-details" options={{ headerShown: false }} />
      <Stack.Screen name="create-edit-movement" options={{ headerShown: false }} />
      <Stack.Screen name="user-preferences" options={{ headerShown: false }} />
    </Stack>
  );
}
