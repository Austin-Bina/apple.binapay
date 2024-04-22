import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { RegistrationParamList } from "../types";
import RegisterScreen from "@screens/auth/register/Start";
import VerifyEmail from "@screens/auth/register/VerifyEmail";
import CreatePassword from "@screens/auth/register/CreatePassword";
import CreateTransactionPin from "@screens/auth/register/CreateTransactionPin";
import ChooseAvatar from "@screens/auth/register/ChooseAvatar";
import RegisterSuccessScreen from "@screens/auth/register/Success";
import tw from "@lib/tailwind";
import { View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";

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
          <View style={tw`mr-2.5 rounded-xl overflow-hidden p-0.5`}>
            <TouchableRipple
              onPress={() => {
                navigation
                  .getParent()
                  .reset({ routes: [{ name: "Onboarding" }] });
              }}
            >
              <LeftArrowIcon width={38} height={38} />
            </TouchableRipple>
          </View>
        ),
      })}
    >
      <Stack.Screen name="Start" component={RegisterScreen} />
      <Stack.Screen name="Verify Email" component={VerifyEmail} />
      <Stack.Screen name="Create Password" component={CreatePassword} />
      <Stack.Screen
        name="Create Transaction Pin"
        component={CreateTransactionPin}
      />
      <Stack.Screen name="Choose Avatar" component={ChooseAvatar} />
      <Stack.Screen
        name="Register Success"
        options={{ headerShown: false }}
        component={RegisterSuccessScreen}
      />
    </Stack.Navigator>
  );
}
export default RegistrationStack;
