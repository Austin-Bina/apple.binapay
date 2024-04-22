import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { HomeParamList } from "@navigators/types";
import { View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import HomeScreen from "@screens/home/Dashboard";
import AddMoneyScreen from "@screens/home/AddMoney";
import CardDetailsScreen from "@screens/home/CardDetails";
import PaymentSuccessScreen from "@screens/home/PaymentSuccess";
import NotificationScreen from "@screens/home/Notification";
import TransactionHistoryScreen from "@screens/home/TransactionHistory";

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
        name="Dashboard"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Add Money" component={AddMoneyScreen} />
      <Stack.Screen name="Card Details" component={CardDetailsScreen} />
      <Stack.Screen
        name="Payment Success"
        options={{ headerShown: false }}
        component={PaymentSuccessScreen}
      />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen
        name="Transaction History"
        component={TransactionHistoryScreen}
      />
    </Stack.Navigator>
  );
}
export default HomeStack;
