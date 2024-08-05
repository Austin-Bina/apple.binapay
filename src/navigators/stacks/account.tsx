import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { AccountParamList } from "@navigators/types";
import SettingScreen from "@screens/account/Setting";
import ProfileScreen from "@screens/account/Profile";
import ChangePassword from "@screens/account/ChangePassword";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import BinaRewardsScreen from "@screens/account/BinaRewards";
import EarningSummaryScreen from "@screens/account/EarningSummary";
import VerifyAccountScreen from "@screens/account/VerifyAccount";

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
          <TouchableRipple
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.reset({ routes: [{ name: "Onboarding" }] });
              }
            }}
            style={tw`mr-2.5 overflow-hidden p-0.5`}
          >
            <LeftArrowIcon width={38} height={38} />
          </TouchableRipple>
        ),
      })}
    >
      <Stack.Screen
        name="Settings"
        component={SettingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="BinaPay Rewards" component={BinaRewardsScreen} />
      <Stack.Screen name="Earning Summary" component={EarningSummaryScreen} />
      <Stack.Screen name="Verify Account" component={VerifyAccountScreen} />
      <Stack.Screen name="Change Password" component={ChangePassword} />
    </Stack.Navigator>
  );
}
export default AccountStack;
