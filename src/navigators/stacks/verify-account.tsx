import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { KYCParamList } from "@navigators/types";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { SCREENS } from "@constants/screens";
import KYCOptionsScreen from "@screens/kyc/KYCOptionsScreen";
import BVNVerificationScreen from "@screens/kyc/BVNVerificationScreen";
import NinVerificationScreen from "@screens/kyc/NINVerificationScreen";

const Stack = createNativeStackNavigator<KYCParamList>();

function KYCStack() {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.ACCOUNT_VERIFICATION_OPTIONS}
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
                navigation.reset({
                  routes: [
                    {
                      name: "Home",
                      params: {
                        screen: "Dashboard",
                      },
                    },
                  ],
                });
              }
            }}
            style={tw`mr-2.5 overflow-hidden p-0.5`}>
            <LeftArrowIcon width={38} height={38} />
          </TouchableRipple>
        ),
      })}>
        <Stack.Screen name={SCREENS.ACCOUNT_VERIFICATION_OPTIONS} component={KYCOptionsScreen} />
        <Stack.Screen name={SCREENS.BVN_VERIFICATION} component={BVNVerificationScreen} />
        <Stack.Screen name={SCREENS.NIN_VERIFICATION} component={NinVerificationScreen} />
    </Stack.Navigator>
  );
}
export default KYCStack;
