import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { TouchableRipple } from "react-native-paper";
import { View } from "react-native"; 
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { SCREENS } from "@constants/screens";
import WithdrawCryptoScreen from "@screens/withdraw/WithdrawCrypto";
import WithdrawNairaScreen from "@screens/withdraw/WithdrawNaira";
import BankAccountsScreen from "@screens/account/BankAccounts";

const Stack = createNativeStackNavigator();

const WithdrawMoneyStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.WITHDRAW_CRYPTO}
      screenOptions={({ navigation }) => ({
        headerStyle: tw`bg-white`,
        headerShadowVisible: false,
        headerTitle: "",
        headerShown: true,
        headerLeft: () => (
          <View style={tw`mr-2.5 rounded-xl overflow-hidden p-0.5 mt-8`}>
            <TouchableRipple
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
                else
                  navigation.reset({
                    routes: [{ name: "Home", params: { screen: "Dashboard" } }],
                  });
              }}
            >
              <LeftArrowIcon width={38} height={38} />
            </TouchableRipple>
          </View>
        ),
      })}
    >
      <Stack.Screen
        name={SCREENS.WITHDRAW_CRYPTO}
        component={WithdrawCryptoScreen}
      />
      <Stack.Screen
        name={SCREENS.WITHDRAW_NAIRA}
        component={WithdrawNairaScreen}
      />

      <Stack.Screen
  name={SCREENS.BANK_ACCOUNTS}
  component={BankAccountsScreen}
  options={{ headerShown: false }}
/>

    </Stack.Navigator>
  );
};

export default WithdrawMoneyStack;
