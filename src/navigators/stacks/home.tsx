import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { HomeParamList } from "@navigators/types";
import { View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import HomeScreen from "@screens/home/Dashboard";
import TransactionHistoryScreen from "@screens/home/TransactionHistory";
import NotificationStack from "./notification";
import AddMoneyStack from "./add-money";
import { SCREENS } from "@constants/screens";

const Stack = createNativeStackNavigator<HomeParamList>();

function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
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
              style={tw`pb-2.5`}>
              <LeftArrowIcon width={38} height={38} />
            </TouchableRipple>
          </View>
        ),
      })}>
      <Stack.Screen name="Dashboard" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen options={{ headerShown: false }} name="Notification" component={NotificationStack} />
      <Stack.Screen name="Transaction History" component={TransactionHistoryScreen} />
      <Stack.Screen name={SCREENS.ADD_MONEY} options={{ headerShown: false }} component={AddMoneyStack} />
    </Stack.Navigator>
  );
}
export default HomeStack;
