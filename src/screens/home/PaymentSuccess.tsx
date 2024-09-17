import { ImageBackground, View } from "react-native";
import React from "react";
import tw from "@lib/tailwind";
import { Button, Text } from "react-native-paper";
import { AddMoneyStackScreenProps } from "@navigators/types";
import { getNavigate } from "@utils/navigation";

type Props = AddMoneyStackScreenProps<"Payment Success">;

export default function PaymentSuccessScreen({ navigation }: Props) {
  const onSubmit = async function () {
    const { reset } = await getNavigate();
    reset({ routes: [{ name: "Dashboard" }] });
  };

  return (
    <ImageBackground source={require("@assets/images/background-with-logo.png")}>
      <View style={tw`flex flex-col px-4 pt-5 justify-between h-full`}>
        <View style={tw`flex-1 justify-center`}>
          <View style={tw`p-4 h-1/2 justify-end`}>
            <View>
              <Text style={tw`w-full font-bold text-3xl text-center text-gray-800 mb-2.5`}>Payment Successful 🎉</Text>
              <Text style={tw`leading-6 w-full font-light text-base text-gray text-center`}>
                Your payment was successful, and your BinaPay wallet has been credited with ₦20,000.00
              </Text>
            </View>
          </View>
        </View>
        <Button
          style={tw`mt-auto mb-[30px] w-full rounded-full`}
          contentStyle={tw`py-2`}
          onPress={onSubmit}
          mode="contained">
          <Text style={tw`text-white text-center text-base font-bold`}>Continue to Home</Text>
        </Button>
      </View>
    </ImageBackground>
  );
}
