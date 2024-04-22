import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { AccountParamList } from "@navigators/types";
import SettingScreen from "@screens/account/Setting";
import ProfileScreen from "@screens/account/Profile";
import ChangePassword from "@screens/account/ChangePassword";
import { View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";

const Stack = createNativeStackNavigator<AccountParamList>();

function AccountStack() {
  return (
    <Stack.Navigator
      initialRouteName="Settings"
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
        name="Settings"
        component={SettingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Change Password" component={ChangePassword} />
    </Stack.Navigator>
  );
}
export default AccountStack;
