import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext, useContext } from 'react';
import 'react-native-reanimated';

import { CustomDarkTheme, CustomLightTheme } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  // initialRouteName: 'home',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a context for theme state
const ThemeToggleContext = createContext({
  isDarkTheme: true,
  toggleTheme: () => {},
});

export function useThemeToggle() {
  return useContext(ThemeToggleContext);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme);
  };

  // Hide the splash screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Render a loading screen while fonts are being loaded
  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <ThemeToggleContext.Provider value={{ isDarkTheme, toggleTheme }}>
      <RootLayoutNav isDarkTheme={isDarkTheme} />
    </ThemeToggleContext.Provider>
  );
}

function RootLayoutNav({ isDarkTheme }: { isDarkTheme: boolean }) {
  return (
    <ThemeProvider value={isDarkTheme ? CustomDarkTheme : CustomLightTheme}>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack>
          {/* Main Stack */}
          <Stack.Screen name="(home)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
    </ThemeProvider>
  );
}

// Placeholder component for the splash screen
function LoadingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </SafeAreaView>
  );
}
