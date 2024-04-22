import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import tw from "@lib/tailwind";
import { View } from "react-native";
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

const Stack = createNativeStackNavigator<StackParamList>();

function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={({ navigation }) => ({
        headerStyle: tw`bg-white`,
        headerShadowVisible: false,
        headerTitle: "",
        headerShown: true,
        headerLeft: () => (
          <View style={tw`mr-2.5 rounded-xl overflow-hidden p-0.5`}>
            <TouchableRipple
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.reset({ routes: [{ name: "Onboarding" }] });
                }
              }}
              style={tw`pb-2.5`}
            >
              <LeftArrowIcon width={38} height={38} />
            </TouchableRipple>
          </View>
        ),
      })}
    >
      <Stack.Screen
        name="Auth"
        component={AuthStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Onboarding"
        component={Onboarding}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Main"
        component={TabBar}
        options={{ headerShown: false }}
      />

      {/*<Stack.Screen
        name="Incoming Call"
        component={IncomingCall}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Call"
        component={ActiveCall}
        options={{ headerShown: false }}
      /> */}

      <Stack.Screen
        name="Busy"
        options={{ headerShown: false }}
        component={Busy}
      />
      <Stack.Screen name="One Time Password" component={VerifyOTPScreen} />
      <Stack.Screen name="Forget Password" component={ForgetPassword} />
      <Stack.Screen name="Reset Password" component={ResetPassword} />
      <Stack.Screen
        name="Reset Password Successful"
        options={{ headerShown: false }}
        component={ResetPasswordSuccessScreen}
      />
    </Stack.Navigator>
  );
}
export default AppNavigator;
