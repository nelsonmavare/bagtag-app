import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Provider as ReduxProvider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/src/hooks/useColorScheme";
import { PaperProvider } from "react-native-paper";
import { Dimensions, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { persistedStore, reduxStore } from "../store/store";
import Toast from "react-native-toast-message";
import { selectAuth } from "../store/AuthSlice";
import { ThemedView } from "../components/ThemedView";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const ScreensContainer = () => {
    const auth = useSelector(selectAuth);
    return (
      <Stack>
        <Stack.Screen name="screens/tag/(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/recoverPassword" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/emailVerification" options={{ headerShown: false }} />{/* @TODO Clean up */}
        <Stack.Screen name="screens/auth/index" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/changeUserInfo" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/deleteAccount" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/changeEmail" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/changePhone" options={{ headerShown: false }} />
        <Stack.Screen name="screens/auth/changeCompany" options={{ headerShown: false }} />

        <Stack.Screen name="screens/scanner" options={{ headerShown: false }} />
        <Stack.Screen name="screens/tag/findTag" options={{ headerShown: false }} />
        <Stack.Screen name="screens/tag/externalApp" options={{ headerShown: false }} />
        <Stack.Screen name="screens/tag/productLost" options={{ headerShown: false }} />
        <Stack.Screen name="screens/tag/productLocation" options={{ headerShown: false }} />
        <Stack.Screen name="screens/dev/blePlxDebug" options={{ headerShown: false }} />
        <Stack.Screen name="screens/dev/bleManagerLocalTest" options={{ headerShown: false }} />

        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
          listeners={({ navigation }) => ({
            focus: () => {
              if (auth) {
                navigation.navigate("screens/tag/(tabs)");
              } else {
                navigation.navigate("screens/auth/index");
              }
            },
          })}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    );
  };

  return (
    <ReduxProvider store={reduxStore}>
      <PersistGate loading={null} persistor={persistedStore}>
        <ThemedView style={{ flex: 1, height: Dimensions.get("window").height }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider value={/* colorScheme === "dark" ? DarkTheme :  */ DefaultTheme}>
              <PaperProvider>
                <ScreensContainer />
                <Toast />
              </PaperProvider>
            </ThemeProvider>
          </GestureHandlerRootView>
        </ThemedView>
      </PersistGate>
    </ReduxProvider>
  );
}
