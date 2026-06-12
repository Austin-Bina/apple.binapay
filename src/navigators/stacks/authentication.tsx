import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import LoginScreen from "@screens/auth/Login";
import { AuthParamList } from "../types";
import tw from "@lib/tailwind";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { View } from "react-native";
import RegistrationStack from "./registration";

const Stack = createNativeStackNavigator<AuthParamList>();

function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={({ navigation }) => ({
        headerStyle: tw`bg-white`,
        headerShadowVisible: false,
        headerTitle: "",
        headerShown: true,
        headerLeft: () => (
          <View style={tw`mr-2.5 rounded-xl overflow-hidden p-0.5 mt-11`}>
            <TouchableRipple
              onPress={() => {
                navigation.goBack();
              }}>
              <LeftArrowIcon width={38} height={38} />
            </TouchableRipple>
          </View>
        ),
      })}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" options={{ headerShown: false }} component={RegistrationStack} />
    </Stack.Navigator>
  );
}
export default AuthStack;
