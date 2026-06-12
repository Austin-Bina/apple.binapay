import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import tw from "@lib/tailwind";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { SCREENS } from "@constants/screens";
import { useGetP2PStatusQuery } from "@store/redux-api/p2p";
import { ActivityIndicator, View } from "react-native";

import P2PManagerIntroScreen from "@screens/p2p/P2PManagerIntro";
import P2PChooseExchangeScreen from "@screens/p2p/P2PChooseExchange";
import P2PWhitelistIPScreen from "@screens/p2p/P2PWhitelistIP";
import P2PConnectAPIScreen from "@screens/p2p/P2PConnectAPI";
import P2PConnectSuccessScreen from "@screens/p2p/P2PConnectSuccess";
import P2PDashboardScreen from "@screens/p2p/P2PDashboard";
import P2POrderDetailScreen from "@screens/p2p/P2POrderDetail";
import P2PInsightsScreen from "@screens/p2p/P2PInsights";
import P2PSettingsScreen from "@screens/p2p/P2PSettings";
import { P2PParamList, P2PStackScreenProps } from "@navigators/types";
import P2PMessageTemplatesScreen from "@screens/p2p/P2PMessageTemplates";
import P2PAdsScreen from "@screens/p2p/P2PAds";
import P2PEditAdScreen from "@screens/p2p/P2PEditAd";

const Stack = createNativeStackNavigator<P2PParamList>();
const BRAND = "hsl(221, 65%, 51%)";

// ── Gate screen — invisible redirect only, never shown to user ───────────────
function P2PGateScreen({ navigation }: any) {
  const { data: statusData, isLoading, isFetching } = useGetP2PStatusQuery();

  useEffect(() => {
    if (isLoading || isFetching) return;

    if (statusData?.connected) {
      navigation.replace(SCREENS.P2P_DASHBOARD);
    } else {
      navigation.replace(SCREENS.P2P_INTRO);
    }
  }, [statusData, isLoading, isFetching]);

  // Always show spinner — this screen is never "seen", just redirects
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator size="large" color={BRAND} />
    </View>
  );
}

// ── Shared back button ────────────────────────────────────────────────────────
const backButton = (navigation: any) => (
  <TouchableRipple
    onPress={() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }}
    style={tw`mr-2.5 overflow-hidden p-0.5 mt-11`}>
    <LeftArrowIcon width={38} height={38} />
  </TouchableRipple>
);

const onboardingScreenOptions = (navigation: any) => ({
  headerShown: true,
  headerStyle: tw`bg-white`,
  headerShadowVisible: false,
  headerTitle: "",
  headerLeft: () => backButton(navigation),
});

// ── Main stack ────────────────────────────────────────────────────────────────
export default function P2PStack() {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.P2P_MANAGER}
      screenOptions={{ headerShown: false }}>

      {/* Gate — spinner + redirect only */}
      <Stack.Screen
        name={SCREENS.P2P_MANAGER}
        component={P2PGateScreen}
        options={{ headerShown: false }}
      />

      {/* Onboarding flow — all use same header */}
      <Stack.Screen
        name={SCREENS.P2P_INTRO as any}
        component={P2PManagerIntroScreen}
        options={({ navigation }) => onboardingScreenOptions(navigation)}
      />
      <Stack.Screen
        name={SCREENS.P2P_CHOOSE_EXCHANGE}
        component={P2PChooseExchangeScreen}
        options={({ navigation }) => onboardingScreenOptions(navigation)}
      />
      <Stack.Screen
        name={SCREENS.P2P_WHITELIST_IP}
        component={P2PWhitelistIPScreen}
        options={({ navigation }) => onboardingScreenOptions(navigation)}
      />
      <Stack.Screen
        name={SCREENS.P2P_CONNECT_API}
        component={P2PConnectAPIScreen}
        options={({ navigation }) => onboardingScreenOptions(navigation)}
      />
      <Stack.Screen
        name={SCREENS.P2P_CONNECT_SUCCESS}
        component={P2PConnectSuccessScreen}
        options={{ headerShown: false }}
      />

      {/* Post-connect screens */}
      <Stack.Screen
        name={SCREENS.P2P_DASHBOARD}
        component={P2PDashboardScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name={SCREENS.P2P_ORDER_DETAIL}
        component={P2POrderDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.P2P_INSIGHTS}
        component={P2PInsightsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={SCREENS.P2P_SETTINGS}
        component={P2PSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
  name={SCREENS.P2P_MESSAGE_TEMPLATES}
  component={P2PMessageTemplatesScreen}
  options={{ headerShown: false }}
/>

<Stack.Screen
  name={SCREENS.P2P_ADS}
  component={P2PAdsScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name={SCREENS.P2P_EDIT_AD}
  component={P2PEditAdScreen}
  options={{ headerShown: false }}
/>

    </Stack.Navigator>
  );
}
