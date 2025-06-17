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
import { supabase } from '@/utils/supabase';
import Auth from '@/components/Auth'; // You may need to adjust the path if Auth is placed elsewhere

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

  // New: Auth state
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function prepare() {
      // Theme preference
      const user = await getUser();
      if (user?.preferences?.theme === 'dark') {
        setIsDarkTheme(true);
      } else {
        setIsDarkTheme(false);
      }

      // Auth check
      const {
        data: { session: supabaseSession },
        error,
      } = await supabase.auth.getSession();
      if (!error) {
        setSession(supabaseSession);
      }
      // Subscribe to auth state changes
      const { data: listener } = supabase.auth.onAuthStateChange((_event, sessionArg) => {
        setSession(sessionArg);
      });

      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }

      setAppReady(true);
      setCheckingSession(false);

      // Clean up the listener on unmount
      return () => {
        listener?.subscription?.unsubscribe();
      };
    }

    prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (!appReady || checkingSession) {
    return <LoadingScreen />;
  }

  return (
    <ThemeToggleContext.Provider value={{ isDarkTheme, toggleTheme }}>
      <ThemeProvider value={isDarkTheme ? CustomDarkTheme : CustomLightTheme}>
        <SafeAreaView style={{ flex: 1 }}>
          {session ? (
            <RootLayoutNav />
          ) : (
            <Auth />
          )}
        </SafeAreaView>
      </ThemeProvider>
    </ThemeToggleContext.Provider>
  );
}

// Remove isDarkTheme prop from RootLayoutNav, as we now have ThemeProvider wrapping it
function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="(home)" options={{ headerShown: false }} />
    </Stack>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </SafeAreaView>
  );
}
