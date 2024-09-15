import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { EducationParamList } from "../types";
import tw from "@lib/tailwind";
import { TouchableRipple } from "react-native-paper";
import LeftArrowIcon from "@assets/icons/arrow-left.svg";
import { View } from "react-native";
import SelectEducationPaymentScreen from "@screens/services/education/SelectEducationPayment";
import EducationPaymentScreen from "@screens/services/education/EducationPayment";

const Stack = createNativeStackNavigator<EducationParamList>();

function EducationStack() {
  return (
    <Stack.Navigator
      initialRouteName="Select Educational Payment"
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
      <Stack.Screen name="Select Educational Payment" component={SelectEducationPaymentScreen} />
      <Stack.Screen name="Educational Payment" component={EducationPaymentScreen} />
    </Stack.Navigator>
  );
}
export default EducationStack;
