import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { AssetsParamList } from "@navigators/types";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { SCREENS } from "@constants/screens";
import AssetsOverviewScreen from "@screens/assets/AssetsOverview";
import CryptoAssets from "@screens/home/CryptoAssets";

const Stack = createNativeStackNavigator<AssetsParamList>();

export default function AssetsStack() {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.ASSETS_OVERVIEW}
      screenOptions={({ navigation }) => ({
        headerStyle: tw`bg-white`,
        headerShadowVisible: false,
        headerTitle: "",
        headerShown: false,
        headerLeft: () => (
          <TouchableRipple
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            style={tw`mr-2.5 overflow-hidden p-0.5 mt-11`}>
            <LeftArrowIcon width={38} height={38} />
          </TouchableRipple>
        ),
      })}>
      <Stack.Screen name={SCREENS.ASSETS_OVERVIEW} component={AssetsOverviewScreen} />
      <Stack.Screen name={SCREENS.CRYPTO_ASSETS} component={CryptoAssets} />
    </Stack.Navigator>
  );
}
