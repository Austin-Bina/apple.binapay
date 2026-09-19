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
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Stack = createNativeStackNavigator<RegistrationParamList>();

function RegistrationStack() {
  return (
    <Stack.Navigator
      initialRouteName="Start"
      
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: "#f8f9fb" },
        headerShadowVisible: false,
        headerTitle: "",
        headerShown: true,
        headerBackVisible: false, 
        headerLeft: () => (
  <TouchableRipple
    onPress={() => navigation.goBack()}
    style={{ borderRadius: 10, overflow: "hidden" }}
  >
    <View style={{
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: "#EEF3FF",
      justifyContent: "center", alignItems: "center"
      
    }}>
      <MaterialCommunityIcons name="arrow-left" size={20} color="#1E3A8A" />
    </View>
  </TouchableRipple>
),
      })}>
      <Stack.Screen name="Start" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Verify Email" component={VerifyEmail} options={{ headerShown: false }}/>
      <Stack.Screen name="Complete Registration" component={CompleteRegistration}options={{ headerShown: false }}/>
      <Stack.Screen name="Register Success" options={{ headerShown: false }} component={RegisterSuccessScreen} />
    </Stack.Navigator>
  );
}
export default RegistrationStack;
