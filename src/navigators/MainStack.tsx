import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import tw from "@lib/tailwind";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { StackParamList } from "./types";
import Busy from "@screens/Busy";
import Onboarding from "@screens/onboarding/Onboarding";
import AuthStack from "./stacks/authentication";
import ForgetPassword from "@screens/auth/ForgetPassword";
import ResetPassword from "@screens/auth/ResetPassword";
import { TouchableRipple } from "react-native-paper";
import ResetPasswordSuccessScreen from "@screens/auth/ResetPasswordSuccess";
import VerifyOTPScreen from "@screens/auth/VerifyOTP";
import { TabBar } from "./tabs/MainTab";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "@utils/navigation";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useTypedSelector } from "@store/common";
import { selectLoggedIn } from "@store/selectors/auth";

const Stack = createNativeStackNavigator<StackParamList>();

function Router() {
  const isLoggedIn = useTypedSelector(selectLoggedIn);

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === "ios" ? "padding" : undefined} enabled>
      <NavigationContainer ref={navigationRef}>
        <BottomSheetModalProvider>
          <Stack.Navigator
            initialRouteName="Onboarding"
            screenOptions={({ navigation }) => ({
              headerStyle: tw`bg-white`,
              headerShadowVisible: false,
              headerTitle: "",
              headerShown: true,
              headerLeft: () => (
                <View style={tw`mr-2.5 overflow-hidden p-0.5`}>
                  <TouchableRipple
                    onPress={() => {
                      navigation.reset({ routes: [{ name: "Main" }] });
                    }}>
                    <LeftArrowIcon width={38} height={38} />
                  </TouchableRipple>
                </View>
              ),
            })}>
            {isLoggedIn ? (
              <React.Fragment>
                <Stack.Screen name="Main" component={TabBar} options={{ headerShown: false }} />
                <Stack.Screen name="One Time Password" component={VerifyOTPScreen} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
                <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
                <Stack.Screen name="Forget Password" component={ForgetPassword} />
                <Stack.Screen
                  name="Reset Password Successful"
                  options={{ headerShown: false }}
                  component={ResetPasswordSuccessScreen}
                />
              </React.Fragment>
            )}

            <Stack.Screen name="Busy" options={{ headerShown: false }} component={Busy} />
            <Stack.Screen name="Reset Password" component={ResetPassword} />
          </Stack.Navigator>
        </BottomSheetModalProvider>
      </NavigationContainer>
    </KeyboardAvoidingView>
  );
}
export default Router;
