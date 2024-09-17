import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { View } from "react-native";
import { SCREENS } from "@constants/screens";
import CardDetailsScreen from "@screens/home/CardDetails";
import PaymentSuccessScreen from "@screens/home/PaymentSuccess";
import AddMoneyScreen from "@screens/fund/AddMoney";
import ManualFundScreen from "@screens/fund/ManualFund";
import { AddMoneyParamList } from "@navigators/types";

const Stack = createNativeStackNavigator<AddMoneyParamList>();

function AddMoneyStack() {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.FUND_ACCOUNT_OPTIONS}
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
              }}>
              <LeftArrowIcon width={38} height={38} />
            </TouchableRipple>
          </View>
        ),
      })}>
      <Stack.Screen name={SCREENS.FUND_ACCOUNT_OPTIONS} component={AddMoneyScreen} />
      <Stack.Screen name={SCREENS.MANUAL_FUND} component={ManualFundScreen} />
      <Stack.Screen name={SCREENS.CARD_DETAILS} component={CardDetailsScreen} />
      <Stack.Screen name={SCREENS.PAYMENT_SUCCESS} options={{ headerShown: false }} component={PaymentSuccessScreen} />
    </Stack.Navigator>
  );
}
export default AddMoneyStack;
