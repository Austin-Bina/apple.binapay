import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { View } from "react-native";
import { SCREENS } from "@constants/screens";
import ManualFundScreen from "@screens/fund/ManualFund";
import { ManualFundParamList } from "@navigators/types";
import ManualFundProofScreen from "@screens/fund/ManualFundProof";
import ManualFundWaitScreen from "@screens/fund/ManualFundWait";
import StartManualFundingScreen from "@screens/fund/StartManualFunding";

const Stack = createNativeStackNavigator<ManualFundParamList>();

function ManualFundStack() {
  return (
    <Stack.Navigator
      initialRouteName={SCREENS.START_MANUAL_FUNDING}
      screenOptions={({ navigation }) => ({
        headerStyle: tw`bg-white`,
        headerShadowVisible: false,
        headerTitle: "",
        headerShown: true,
        headerLeft: () => (
          <View style={tw`mr-2.5 rounded-xl overflow-hidden p-0.5 mt-8`}>
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
              }}>
              <LeftArrowIcon width={38} height={38} />
            </TouchableRipple>
          </View>
        ),
      })}>
      <Stack.Screen name={SCREENS.START_MANUAL_FUNDING} component={StartManualFundingScreen} />
      <Stack.Screen name={SCREENS.MANUAL_FUND} component={ManualFundScreen} />
      <Stack.Screen name={SCREENS.MANUAL_FUND_PROOF} component={ManualFundProofScreen} />
      <Stack.Screen name={SCREENS.MANUAL_FUND_WAIT} options={{ headerShown: false }} component={ManualFundWaitScreen} />
    </Stack.Navigator>
  );
}
export default ManualFundStack;
