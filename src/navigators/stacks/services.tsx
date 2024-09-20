import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { ServicesParamList } from "@navigators/types";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import ListServicesScreen from "@screens/services/List";
import AirtimePurchaseScreen from "@screens/services/AirtimePurchase";
import DataPurchaseScreen from "@screens/services/DataPurchase";
import TransactionConfirmationScreen from "@screens/services/TransactionConfirmation";
import ViewTransaction from "@screens/services/ViewTransaction";
import ElectricityPurchaseScreen from "@screens/services/ElectricityPurchase";
import AirtimeEPINPurchaseScreen from "@screens/services/AirtimeEPINPurchase";
import TVSubscriptionScreen from "@screens/services/TVSubscription";
import EducationStack from "./education";

const Stack = createNativeStackNavigator<ServicesParamList>();

export default function ServicesStack() {
  return (
    <Stack.Navigator
      initialRouteName="List"
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
            style={tw`mr-2.5 overflow-hidden p-0.5`}>
            <LeftArrowIcon width={38} height={38} />
          </TouchableRipple>
        ),
      })}>
      <Stack.Screen name="List" component={ListServicesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Airtime Purchase" component={AirtimePurchaseScreen} />
      <Stack.Screen name="Airtime EPIN Purchase" component={AirtimeEPINPurchaseScreen} />
      <Stack.Screen name="Data Purchase" component={DataPurchaseScreen} />
      <Stack.Screen name="Confirm Transaction" component={TransactionConfirmationScreen} />
      <Stack.Screen
        name="View Transaction"
        component={ViewTransaction}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Electricity Bill" component={ElectricityPurchaseScreen} />
      <Stack.Screen name="Education" options={{ headerShown: false }} component={EducationStack} />
      <Stack.Screen name="TV Subscription" component={TVSubscriptionScreen} />
    </Stack.Navigator>
  );
}
