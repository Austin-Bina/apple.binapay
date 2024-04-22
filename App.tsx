import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { defaultTheme } from "./src/constants/theme";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "@utils/navigation";
import AppNavigator from "@navigators/MainStack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import tw from "@lib/tailwind";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Make any API calls you need to do here
        // Bootstrap app

        // Artificially delay for two seconds to simulate a slow loading
        // experience. Please remove this if you copy and paste the code!
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <PaperProvider theme={defaultTheme}>
        <GestureHandlerRootView style={tw`flex-1`} onLayout={onLayoutRootView}>
          <BottomSheetModalProvider>
            <StatusBar style="dark" animated />
            <AppNavigator />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </PaperProvider>
    </NavigationContainer>
  );
}
