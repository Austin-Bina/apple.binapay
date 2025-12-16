import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { RegistrationParamList } from "../types";
import RegisterScreen from "@screens/auth/register/Start";
import VerifyEmail from "@screens/auth/register/VerifyEmail";
import RegisterSuccessScreen from "@screens/auth/register/complete/Success";
import tw from "@lib/tailwind";
import { View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import CompleteRegistration from "@screens/auth/register/complete";

const Stack = createNativeStackNavigator<RegistrationParamList>();

function RegistrationStack() {
  return (
    <Stack.Navigator
      initialRouteName="Start"
      screenOptions={({ navigation }) => ({
        headerStyle: tw`bg-white`,
        headerShadowVisible: false,
        headerTitle: "",
        headerShown: true,
        headerLeft: () => (
          <View style={tw`mr-2.5 rounded-xl overflow-hidden p-0.5 mt-0.1`}>
            <TouchableRipple
              onPress={() => {
                navigation.getParent()?.reset({ routes: [{ name: "Onboarding" }] });
              }}>
              <LeftArrowIcon width={38} height={38} />
            </TouchableRipple>
          </View>
        ),
      })}>
      <Stack.Screen name="Start" component={RegisterScreen} />
      <Stack.Screen name="Verify Email" component={VerifyEmail} />
      <Stack.Screen name="Complete Registration" component={CompleteRegistration} />
      <Stack.Screen name="Register Success" options={{ headerShown: false }} component={RegisterSuccessScreen} />
    </Stack.Navigator>
  );
}
export default RegistrationStack;
