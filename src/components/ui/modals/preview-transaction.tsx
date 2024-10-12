import React, { forwardRef } from "react";
import { View } from "react-native";
import tw from "@lib/tailwind";
import { Button, Text } from "react-native-paper";
import { BottomSheetModal as GorhomBottomSheet } from "@gorhom/bottom-sheet";
import GorhomBottomSheetModal from "./BottomSheet/BottomSheet";
import { vs } from "react-native-size-matters";
import { Image } from "react-native-element-image";

type Props = {
  title: string;
  details: {
    label: string;
    value: string;
    icon?: any;
  }[];
  buttonLabel: string;
  onConfirm: () => void;
  onDismiss: () => void;
  snapPoints?: string[];
  disabled?: boolean;
};

const BottomSheetModal = forwardRef<GorhomBottomSheet, Props>(
  ({ title, details, buttonLabel, onConfirm, onDismiss,snapPoints = ["50%", "50%"], disabled }, ref) => {
    return (
      <GorhomBottomSheetModal  enablePanDownToClose={false} onDismiss={onDismiss} ref={ref} initialSnapPoints={snapPoints} scrollable={false}>
        <View style={tw`px-4 flex-1`}>
          <Text style={tw`font-bold text-gray-800 mb-4 text-lg`}>{title}</Text>

          <View>
            {details.map((detail, index) => (
              <View style={tw`flex-row justify-between my-2 text-base font-normal`} key={index}>
                <Text>{detail.label}:</Text>
                <View style={tw`flex-row items-center gap-2`}>
                  {detail.icon && <Image source={detail.icon} width={30} />}
                  <Text style={tw`text-lg font-bold`}>{detail.value}</Text>
                </View>
              </View>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={onConfirm}
            disabled={disabled}
            contentStyle={tw`py-2`}
            labelStyle={tw`text-base font-semibold`}
            style={[tw`w-full rounded-full`, { marginTop: vs(50) }]}>
            {buttonLabel}
          </Button>
        </View>
      </GorhomBottomSheetModal>
    );
  },
);

export default BottomSheetModal;
