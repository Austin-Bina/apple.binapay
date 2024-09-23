import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { View } from "react-native";
import { SCREENS } from "@constants/screens";
import PaymentSuccessScreen from "@screens/home/PaymentSuccess";
import { AddMoneyParamList } from "@navigators/types";
import ManualFundStack from "./manual-fund";

const Stack = createNativeStackNavigator<AddMoneyParamList>();

function AddMoneyStack() {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.MANUAL_FUND_STACK}
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
      <Stack.Screen name={SCREENS.PAYMENT_SUCCESS} options={{ headerShown: false }} component={PaymentSuccessScreen} />
      <Stack.Screen name={SCREENS.MANUAL_FUND_STACK} options={{ headerShown: false }} component={ManualFundStack} />
    </Stack.Navigator>
  );
}
export default AddMoneyStack;
