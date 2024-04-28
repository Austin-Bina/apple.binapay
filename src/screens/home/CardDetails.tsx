import CustomTextInput from "@components/ui/form/TextInput";
import Screen from "@components/ui/shared/Screen";
import tw from "@lib/tailwind";
import { HomeStackScreenProps } from "@navigators/types";
import React from "react";
import { Dimensions, View } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text, TextInput } from "react-native-paper";
import { scale } from "react-native-size-matters";

type Props = HomeStackScreenProps<"Card Details">;

const deviceWidth = Dimensions.get("window").width;

export default function CardDetailsScreen({ navigation }: Props) {
  const onSubmit = () => {
    navigation.navigate("Payment Success");
  };

  return (
    <Screen>
      <View style={tw`flex flex-col px-4 pt-10 justify-between h-full`}>
        <View>
          <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            Enter Card Details
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-400 mb-6`}>
            Securely add funds to your BinaPay wallet by entering your card
            details below.
          </Text>

          <View>
            <TextInput
              style={tw`text-center w-full bg-white my-5`}
              contentStyle={tw`font-bold text-2xl text-gray-700`}
              outlineStyle={tw.style(
                "rounded-2xl",
                false ? "border-red-500" : "border-gray-300"
              )}
              mode="outlined"
              value="₦20,000.00"
              keyboardType="numeric"
            />

            <CustomTextInput
              label="Card Number"
              placeholder="0000 0000 0000 0000"
            />
            <View style={tw`flex-row justify-between`}>
              <View style={tw`w-[45%]`}>
                <CustomTextInput label="Exp Date" placeholder="MM/YYYY" />
              </View>

              <View style={tw`w-[45%]`}>
                <CustomTextInput label="CVV" placeholder="000" />
              </View>
            </View>
          </View>
        </View>
        <View>
          <Button
            style={tw`mt-10 mb-[30px] w-full rounded-full`}
            contentStyle={tw`py-2`}
            onPress={onSubmit}
            mode="contained"
          >
            <Text style={tw`text-white text-center text-base font-bold`}>
              Pay Now
            </Text>
          </Button>

          <Image
            source={require("@assets/images/secured-by-paystack.png")}
            width={scale(deviceWidth - 200)}
            style={tw`mx-auto`}
          />
        </View>
      </View>
    </Screen>
  );
}
