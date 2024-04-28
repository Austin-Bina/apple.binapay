import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import tw from "@lib/tailwind";
import { ServicesParamList } from "@navigators/types";
import { View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import ListServicesScreen from "@screens/services/List";
import AirtimePurchaseScreen from "@screens/services/AirtimePurchase";
import DataPurchaseScreen from "@screens/services/DataPurchase";
import TransactionConfirmationScreen from "@screens/services/TransactionConfirmation";
import TransactionSuccessScreen from "@screens/services/TransactionSuccess";
import ElectricityPurchaseScreen from "@screens/services/ElectricityPurchase";
import SelectEducationPaymentScreen from "@screens/services/education/SelectEducationPayment";
import EducationPaymentScreen from "@screens/services/education/EducationPayment";
import AirtimeEPINPurchaseScreen from "@screens/services/AirtimeEPINPurchase";
import TVSubscriptionScreen from "@screens/services/TVSubscription";

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
                navigation.reset({ routes: [{ name: "Onboarding" }] });
              }
            }}
            style={tw`mr-2.5 overflow-hidden p-0.5`}
          >
            <LeftArrowIcon width={38} height={38} />
          </TouchableRipple>
        ),
      })}
    >
      <Stack.Screen
        name="List"
        component={ListServicesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Airtime Purchase" component={AirtimePurchaseScreen} />
      <Stack.Screen
        name="Airtime EPIN Purchase"
        component={AirtimeEPINPurchaseScreen}
      />
      <Stack.Screen name="Data Purchase" component={DataPurchaseScreen} />
      <Stack.Screen
        name="Confirm Transaction"
        component={TransactionConfirmationScreen}
      />
      <Stack.Screen
        name="Service Purchase Success"
        component={TransactionSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Electricity Bill"
        component={ElectricityPurchaseScreen}
      />
      <Stack.Screen
        name="Select Educational Payment"
        component={SelectEducationPaymentScreen}
      />
      <Stack.Screen
        name="Educational Payment"
        component={EducationPaymentScreen}
      />
      <Stack.Screen
        name="TV Subscription"
        component={TVSubscriptionScreen}
      />
    </Stack.Navigator>
  );
}
