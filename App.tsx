import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, PaperProvider } from "react-native-paper";
import Router from "@navigators/MainStack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import tw from "@lib/tailwind";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { persistor, store } from "@store/main";
import { PersistGate } from "redux-persist/integration/react";
import NoNetworkBar from "@components/ui/widgets/no-network-bar";
import { BackHandler, View } from "react-native";
import { RootSiblingParent as ToastRootSiblingParent } from "react-native-root-siblings";
import { defaultTheme } from "@constants/theme/md-theme";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { AppVersionProvider } from "@providers/app-version-provider";
import { Dialog, Button, Portal, Text } from "react-native-paper";

SplashScreen.preventAutoHideAsync();

function BinaPay() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [exitDialogVisible, setExitDialogVisible] = useState(false);

  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
/**
 * justice version
 */
  /*
  useEffect(() => {
    const handleBackButtonClick = () => {
      setExitDialogVisible(true);
      return true;
    };

    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);

    async function prepare() {
      try {
        // Make any API calls you need to do here
        // Bootstrap app
        // Artificially delay for two seconds to simulate a slow loading
        // experience. Please remove this if you copy and paste the code!
        // await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    return () => {
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    };
  }, []);
*/

/**
 * my version
 */
useEffect(() => {
  const handleBackButtonClick = () => {
    setExitDialogVisible(true);
    return true;
  };

  const subscription = BackHandler.addEventListener(
    "hardwareBackPress",
    handleBackButtonClick
  );

  async function prepare() {
    try {
      setAppIsReady(true);
    } catch (e) {
      console.warn(e);
    }
  }

  prepare();

  return () => subscription.remove(); // ✅ correct cleanup
}, []);
//end here


  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return null;
  }

  const handleExitCancel = () => {
    setExitDialogVisible(false);
  };

  const handleExitConfirm = () => {
    setExitDialogVisible(false);
    BackHandler.exitApp();
  };

  return (
    <ToastRootSiblingParent>
      <GestureHandlerRootView
        style={tw`flex-1 relative`}
        onLayout={onLayoutRootView}
      >
        <StatusBar style="dark" animated backgroundColor="white" />
        <Provider store={store}>
          <PersistGate
            loading={<ActivityIndicator size="small" />}
            persistor={persistor}
          >
            <PaperProvider theme={defaultTheme}>
              <AppVersionProvider>
                <NoNetworkBar />
                <Router />
                <Portal>
                  <Dialog
                    visible={exitDialogVisible}
                    onDismiss={handleExitCancel}
                    style={tw`p-4 bg-white rounded-xl`}>
                    <View style={tw`items-center pb-2`}>
                      <View style={tw`justify-center h-16 w-16 items-center p-4 bg-blue-50 rounded-3xl mb-2.5`}>
                        <Text style={tw`text-3xl`}>👋</Text>
                      </View>
                      <Dialog.Title style={tw`text-xl font-semibold text-gray-800`}>
                        Exit Application
                      </Dialog.Title>
                    </View>
                    <Dialog.Content>
                      <Text style={tw`text-gray-600 text-center`}>
                        Are you sure you want to exit the BinaPay app?
                      </Text>
                    </Dialog.Content>
                    <Dialog.Actions style={tw`p-4`}>
                      <Button 
                        mode="outlined" 
                        onPress={handleExitCancel} 
                        style={tw`mr-2 flex-1 border-gray-300`}
                        labelStyle={tw`text-gray-700`}>
                        Cancel
                      </Button>
                      <Button 
                        mode="contained" 
                        onPress={handleExitConfirm}
                        style={tw`flex-1 bg-primary-600`}
                        labelStyle={tw`text-white`}>
                        Exit
                      </Button>
                    </Dialog.Actions>
                  </Dialog>
                </Portal>
              </AppVersionProvider>
            </PaperProvider>
          </PersistGate>
        </Provider>
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

// export default !__DEV__ ? Sentry.wrap(BinaPay) : BinaPay;
export default BinaPay;
