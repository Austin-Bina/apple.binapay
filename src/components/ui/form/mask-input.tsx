import tw from "@lib/tailwind";
import React from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import MaskInput, { Mask, MaskInputProps } from "react-native-mask-input";

interface Props extends MaskInputProps {
  errorMessage?: string;
  mask: Mask;
  label?: string;
  contentStyle?: StyleProp<ViewStyle>;
  error?: boolean;
  mode?: "outlined" | "flat";
  value?: string;
  onChangeText?: (unmasked: string) => void;
}

export default function MaskedInput({
  label,
  style,
  error,
  errorMessage,
  mode = "outlined",
  value,
  onChangeText,
  placeholder,
  mask,
  ...rest
}: Props) {
  return (
    <View>
      {label && <Text style={tw`text-gray text-sm font-medium leading-loose`}>{label}</Text>}
      <MaskInput
        value={value}
        onChangeText={(masked, unmasked) => {
          onChangeText?.(unmasked);
        }}
        mask={mask}
        keyboardType="numeric"
        style={[
          tw.style(
            "rounded-xl h-12 border py-2 px-4 w-full bg-white text-base",
            error ? "border-red-500 border-2" : "border-gray-300",
          ),
          style,
        ]}
        placeholder={placeholder}
        {...rest}
      />
    </View>
  );
}
