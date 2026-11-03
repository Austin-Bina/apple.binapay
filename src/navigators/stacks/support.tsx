import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { View } from "react-native";
import { SCREENS } from "@constants/screens";
import { SupportParamList } from "@navigators/types";
import SupportDepartment from "@screens/support/SupportDepartment";
import ChatSupport from "@screens/support/ChatSupport";
import StartConversation from "@screens/support/StartConversation";
import SupportHistory from "@screens/support/SupportHistory";
import { resetNavigationToDashboard } from "@utils/navigation";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { SupportTabsParamList } from "@navigators/types";
import SupportHub from "@screens/support/SupportHub";
import SupportFaq from "@screens/support/SupportFaq";
import SupportAssistant from "@screens/support/SupportAssistant";

const Stack = createNativeStackNavigator<SupportParamList>();
const Tabs = createMaterialTopTabNavigator<SupportTabsParamList>();

export default function SupportStack() {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.SUPPORT_HUB}
      screenOptions={({ navigation }) => ({
        headerStyle: tw`bg-white`,
        headerShadowVisible: false,
        headerTitle: "",
        headerShown: true,
        headerLeft: () => (
          <View style={tw`mr-2.5 rounded-xl overflow-hidden p-0.5 mt-11`}>
            <TouchableRipple
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  resetNavigationToDashboard();
                }
              }}>
              <LeftArrowIcon width={38} height={38} />
            </TouchableRipple>
          </View>
        ),
      })}>

      {/* Department-only tab — kept purely as the fallback StartConversation
          redirects to when no department was supplied. No longer anyone's
          main entry point. */}
      <Stack.Screen name={SCREENS.DEPARTMENT_AND_HISTORY_TAB} options={{ headerShown: false }}>
        {() => (
          <Tabs.Navigator initialRouteName={SCREENS.SUPPORT_DEPARTMENT} screenOptions={{}}>
            <Tabs.Screen
              name={SCREENS.SUPPORT_DEPARTMENT}
              options={{ title: "Department" }}
              component={SupportDepartment}
            />
          </Tabs.Navigator>
        )}
      </Stack.Screen>

      <Stack.Screen name={SCREENS.SUPPORT_START_CONVERSATION} component={StartConversation} options={{ headerShown: false }} />
      <Stack.Screen name={SCREENS.SUPPORT_CHAT} options={{ headerShown: false }} component={ChatSupport} />
      <Stack.Screen name={SCREENS.SUPPORT_HUB} component={SupportHub} options={{ headerShown: false }} />
      <Stack.Screen name={SCREENS.SUPPORT_FAQ} component={SupportFaq} options={{ headerShown: false }} />
      <Stack.Screen name={SCREENS.SUPPORT_ASSISTANT} component={SupportAssistant} options={{ headerShown: false }} />

      {/* Now a plain stack screen — no tab bar, no swipe, normal back behavior */}
      <Stack.Screen name={SCREENS.SUPPORT_HISTORY} component={SupportHistory} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
