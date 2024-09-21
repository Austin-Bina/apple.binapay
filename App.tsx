import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, PaperProvider } from "react-native-paper";
import { defaultTheme } from "./src/constants/theme";
import Router from "@navigators/MainStack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import tw from "@lib/tailwind";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { persistor, store } from "@store/main";
import { PersistGate } from "redux-persist/integration/react";
import NoNetworkBar from "@components/ui/widgets/no-network-bar";
import { Alert, BackHandler } from "react-native";
import { RootSiblingParent as ToastRootSiblingParent } from "react-native-root-siblings";

SplashScreen.preventAutoHideAsync();

function Binapay() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    // ErrorHelper.init();

    const handleBackButtonClick = () => {
      Alert.alert(
        "Exit",
        "Are you sure you want to exit the app?",
        [
          {
            text: "Cancel",
            onPress: () => {},
            style: "cancel",
          },
          { text: "OK", onPress: () => BackHandler.exitApp() },
        ],
        { cancelable: false },
      );
      return true;
    };

    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);

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

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackButtonClick);
    };
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
    <ToastRootSiblingParent>
      <GestureHandlerRootView style={tw`flex-1`} onLayout={onLayoutRootView}>
        <React.Fragment>
          <StatusBar style="dark" animated backgroundColor="white" />
          <Provider store={store}>
            <PersistGate loading={<ActivityIndicator size="small" />} persistor={persistor}>
              <PaperProvider theme={defaultTheme}>
                <NoNetworkBar />
                <Router />
              </PaperProvider>
            </PersistGate>
          </Provider>
        </React.Fragment>
      </GestureHandlerRootView>
    </ToastRootSiblingParent>
  );
}

// if (!__DEV__) {
//   Sentry.init({
//     dsn: Config.SENTRY_DSN,
//     tracesSampleRate: 1.0,
//     attachScreenshot: true,
//   });
// }

// export default !__DEV__ ? Sentry.wrap(Binapay) : Binapay;
export default Binapay;
