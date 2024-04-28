import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { serviceProvidersMap } from "@constants/providers";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { Fragment } from "react";
import { TouchableOpacity, View } from "react-native";
import { Image } from "react-native-element-image";
import { Text, TouchableRipple } from "react-native-paper";

type Props = ServicesStackScreenProps<"Select Educational Payment">;

export default function SelectEducationPaymentScreen({ navigation }: Props) {
  return (
    <Screen>
      <ScrollableView style={tw`px-4`}>
        <Text
          variant="titleLarge"
          style={tw`text-gray-800 mb-2 font-bold mt-10 `}
        >
          Make Educational Payment
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          Pay for your educational expenses with ease.
        </Text>
        <View style={tw`mt-4`}>
          {Object.values(serviceProvidersMap.education).map((provider) => (
            <TouchableOpacity
              key={provider.key}
              onPress={() => {
                navigation.navigate("Educational Payment", {
                  provider: provider.key,
                });
              }}
              style={tw`flex-row items-center gap-2 my-3 p-2 rounded-2xl border border-gray-100`}
            >
              <Fragment>
                <Image source={provider.logo} width={60} height={60} />
                <View>
                  <Text variant="titleMedium" style={tw`text-gray-900`}>
                    {provider.label}
                  </Text>
                  <Text variant="bodySmall" style={tw`text-gray-500`}>
                    {provider.description}
                  </Text>
                </View>
              </Fragment>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollableView>
    </Screen>
  );
}
