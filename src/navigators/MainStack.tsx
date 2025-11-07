import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import tw from "@lib/tailwind";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { StackParamList } from "./types";
import Busy from "@screens/Busy";
import Onboarding from "@screens/onboarding/Onboarding";
import AuthStack from "./stacks/authentication";
import ForgetPassword from "@screens/auth/ForgotPassword";
import { TouchableRipple } from "react-native-paper";
import ResetPasswordSuccessScreen from "@screens/auth/ResetPasswordSuccess";
import { TabBar } from "./tabs/MainTab";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "@utils/navigation";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useTypedSelector } from "@store/common";
import { selectIsFetchingProfile, selectLoggedIn, selectNewUser } from "@store/selectors/auth";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { SCREENS } from "@constants/screens";
import RequestOneTimePasswordScreen from "@screens/auth/RequestOneTimePassword";
import ResetPasswordScreen from "@screens/auth/ResetPassword";

const Stack = createNativeStackNavigator<StackParamList>();

function Router() {
  const isLoggedIn = useTypedSelector(selectLoggedIn);
  const isNewUser = useTypedSelector(selectNewUser);
  const isFetchingProfile = useTypedSelector(selectIsFetchingProfile);

  const isAuthenticated = isLoggedIn && !isNewUser;

  console.log("Router mounted. isLoggedIn:", isLoggedIn, "| isNewUser:", isNewUser, "| isAuthenticated:", isAuthenticated);

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === "ios" ? "padding" : undefined} enabled>
      <NavigationContainer ref={navigationRef}>
        <BottomSheetModalProvider>
          <Stack.Navigator
             initialRouteName={isAuthenticated ? SCREENS.MAIN : SCREENS.ONBOARDING}

            screenOptions={({ navigation }) => ({
              headerStyle: tw`bg-white`,
              headerShadowVisible: false,
              headerTitle: "",
              headerShown: true,
             
             
              headerLeft: () => (
                <View style={tw`mr-2.5 overflow-hidden p-0.5`}>
                  <TouchableRipple
                    onPress={() => {
                      navigation.goBack();
                    }}>
                    <LeftArrowIcon width={38} height={38} />
                  </TouchableRipple>
                </View>
              ),

              
            })}>
            {isAuthenticated ? (
              <React.Fragment>
                <Stack.Screen name={SCREENS.MAIN} component={TabBar} options={{ headerShown: false }} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Stack.Screen name={SCREENS.AUTH} component={AuthStack} options={{ headerShown: false }} />
                <Stack.Screen name={SCREENS.ONBOARDING} component={Onboarding} options={{ headerShown: false }} />
              </React.Fragment>
            )}
            <Stack.Screen name={SCREENS.FORGOT_PASSWORD} component={ForgetPassword} />
            <Stack.Screen name={SCREENS.BUSY} options={{ headerShown: false }} component={Busy} />
            <Stack.Screen name={SCREENS.REQUEST_ONE_TIME_PASSWORD} component={RequestOneTimePasswordScreen} />
            <Stack.Screen name={SCREENS.RESET_PASSWORD} component={ResetPasswordScreen} />
            <Stack.Screen
              name={SCREENS.RESET_PASSWORD_SUCCESS}
              options={{ headerShown: false }}
              component={ResetPasswordSuccessScreen}
            />
          </Stack.Navigator>
        </BottomSheetModalProvider>
      </NavigationContainer>
      <PleaseWaitModal visible={isFetchingProfile} />
    </KeyboardAvoidingView>
  );
}
export default Router;
