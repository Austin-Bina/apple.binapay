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
import ViewTransaction from "@screens/services/ViewTransaction";
import WithdrawMoneyStack from "./withdraw-money"; // import your stack
import CryptoAssets from "@screens/home/CryptoAssets";
import SupportStack from "./support";

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
          <View style={tw`mr-2.5 rounded-xl overflow-hidden p-0.5 mt-0.1`}>
            <TouchableRipple
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.reset({
                    routes: [
                      {
                        name: "Dashboard",
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
      <Stack.Screen name={SCREENS.VIEW_TRANSACTION} component={ViewTransaction} options={{ headerShown: false }} />
      <Stack.Screen name={SCREENS.ADD_MONEY} options={{ headerShown: false }} component={AddMoneyStack} />
      <Stack.Screen name={SCREENS.WITHDRAW_MONEY} options={{ headerShown: false }} component={WithdrawMoneyStack} />
      <Stack.Screen name="Crypto Assets" component={CryptoAssets} />
     <Stack.Screen name={SCREENS.SUPPORT_STACK} options={{ headerShown: false }} component={SupportStack} />
      
      
    </Stack.Navigator>
  );
}
export default HomeStack;
