import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext, useContext } from 'react';
import 'react-native-reanimated';

import { CustomDarkTheme, CustomLightTheme } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import { getUser, saveUser } from '@/utils/user.utils';

export const unstable_settings = {
  // initialRouteName: 'home',
};

SplashScreen.preventAutoHideAsync();

// Context
const ThemeToggleContext = createContext({
  isDarkTheme: true,
  toggleTheme: () => { },
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
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      const user = await getUser();
      if (user?.preferences?.theme === 'dark') {
        setIsDarkTheme(true);
      } else {
        setIsDarkTheme(false);
      }

      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }

      setAppReady(true);
    }

    prepare();
  }, [fontsLoaded]);

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);

    const user = await getUser();
    if (user) {
      user.preferences.theme = newTheme ? 'dark' : 'light';
      await saveUser(user);
    }
  };

  if (!appReady) {
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
          <Stack.Screen name="(home)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
    </ThemeProvider>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </SafeAreaView>
  );
}
