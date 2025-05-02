import { Stack } from "expo-router";

export default function HomeLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="pr-details" options={{ title: "PR Details" }} />
    </Stack>
  );
}
