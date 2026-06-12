import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { NotificationParamList } from "../types";
import tw from "@lib/tailwind";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { View } from "react-native";
import NotificationScreen from "@screens/notification/Notification";
import ViewNotificationScreen from "@screens/notification/ViewNotification";

const Stack = createNativeStackNavigator<NotificationParamList>();

function NotificationStack() {
  return (
    <Stack.Navigator
      initialRouteName="List Notifications"
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
                   navigation.getParent()?.reset({
  routes: [
    {
      name: "Main", // the root Tab navigator name from StackParamList
      params: { screen: "Dashboard" }, // nested HomeParamList screen
    },
  ],
});
                }
              }}>
              <LeftArrowIcon width={38} height={38} />
            </TouchableRipple>
          </View>
        ),
      })}>
      <Stack.Screen name="List Notifications" component={NotificationScreen} />
      <Stack.Screen name="View Notification" component={ViewNotificationScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
export default NotificationStack;
