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
        name="List"
        component={ListServicesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Airtime Purchase" component={AirtimePurchaseScreen} />
      <Stack.Screen name="Data Purchase" component={DataPurchaseScreen} />
    </Stack.Navigator>
  );
}
