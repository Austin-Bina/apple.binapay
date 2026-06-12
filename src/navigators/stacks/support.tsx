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
import { options } from "node_modules/axios/index.cjs";

const Stack = createNativeStackNavigator<SupportParamList>();
const Tabs = createMaterialTopTabNavigator<SupportTabsParamList>();

export default function SupportStack() {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.DEPARTMENT_AND_HISTORY_TAB}
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
      <Stack.Screen name={SCREENS.DEPARTMENT_AND_HISTORY_TAB} options={{ headerShown: false }}>
        {() => (
          <Tabs.Navigator initialRouteName={SCREENS.SUPPORT_DEPARTMENT} screenOptions={{}}>
            <Tabs.Screen
              name={SCREENS.SUPPORT_DEPARTMENT}
              options={{
                title: "Department",
                
              }}
              component={SupportDepartment}
            />
            <Tabs.Screen name={SCREENS.SUPPORT_HISTORY} component={SupportHistory} />
          </Tabs.Navigator>
        )}
      </Stack.Screen>
      <Stack.Screen name={SCREENS.SUPPORT_START_CONVERSATION} component={StartConversation} options={{ headerShown: false }} />
      <Stack.Screen name={SCREENS.SUPPORT_CHAT} options={{ headerShown: false }} component={ChatSupport} />
    </Stack.Navigator>
  );
}
