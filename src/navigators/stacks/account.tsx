import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { AccountParamList } from "@navigators/types";
import SettingScreen from "@screens/account/Setting";
import ProfileScreen from "@screens/account/Profile";
import ChangePassword from "@screens/account/ChangePassword";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import BinaRewardsScreen from "@screens/account/BinaRewards";
import EarningSummaryScreen from "@screens/account/EarningSummary";
import { SCREENS } from "@constants/screens";
import KYCStack from "./verify-account";
import SupportStack from "./support";
import BankAccountsScreen from "@screens/account/BankAccounts";
import CryptoAssets from "@screens/home/CryptoAssets";
import LeaderboardScreen from "@screens/account/LeaderBoard";
import ChangeTransactionPin from "@screens/account/ChangeTransactionPin";
import AutoCryptoSettlement from "@screens/account/AutoCryptoSettlement";
import P2PStack from "./p2p";
import StatementScreen from "@screens/account/StatementScreen";

const Stack = createNativeStackNavigator<AccountParamList>();

function AccountStack() {
  return (
    <Stack.Navigator
      initialRouteName="Settings"
      screenOptions={({ navigation }) => ({
        headerStyle: tw`bg-white`,
        headerShadowVisible: false,
        headerTitle: "",
        headerShown: true,
        headerLeft: () => (
          <TouchableRipple
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
             navigation.getParent()?.reset({
           routes: [
              {
      name: SCREENS.MAIN, // Tab navigator key
      params: {
        screen: SCREENS.DASHBOARD, // nested HomeParamList screen
      },
    },
  ],
});
              }
            }}
            style={tw`mr-2.5 overflow-hidden p-0.5 mt-11`}>
            <LeftArrowIcon width={38} height={38} />
          </TouchableRipple>
        ),
      })}>
      <Stack.Screen name="Settings" component={SettingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BinaPay Rewards" component={BinaRewardsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Earning Summary" component={EarningSummaryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: "Referral Leaderboard", headerShown: false }}  />
      <Stack.Screen name="Change Password" component={ChangePassword} options={{ headerShown: false }} />
      <Stack.Screen name={SCREENS.VERIFY_ACCOUNT} options={{ headerShown: false }} component={KYCStack} />
      <Stack.Screen name={SCREENS.SUPPORT_STACK} options={{ headerShown: false }} component={SupportStack} />
      <Stack.Screen name={SCREENS.BANK_ACCOUNTS}  component={BankAccountsScreen} options={{ headerShown: false }} />
      <Stack.Screen name={SCREENS.CHANGE_PIN}  component={ChangeTransactionPin} options={{ headerShown: false }} />
      <Stack.Screen name={SCREENS.AUTO_CRYPTO_SETTLEMENT}  component={AutoCryptoSettlement} options={{ headerShown: false }} />
<Stack.Screen
  name={SCREENS.P2P_MANAGER_STACK}
  component={P2PStack}
  options={{ headerShown: false }}
/>

<Stack.Screen
  name={SCREENS.STATEMENT}
  component={StatementScreen}
  options={{ headerShown: false }}
/>

      {/* Crypto Assets 
      <Stack.Screen name={SCREENS.CRYPTO_ASSETS} component={CryptoAssets} options={{ title: "All Assets" }} />
*/}
    </Stack.Navigator>
  );
}
export default AccountStack;
