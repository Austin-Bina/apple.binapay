import tw from "@lib/tailwind";
import React from "react";
import { View, Text } from "react-native";
import MaskInput, { Mask } from "react-native-mask-input";
import { HelperText, TextInputProps } from "react-native-paper";

interface Props extends TextInputProps {
  errorMessage?: string;
  mask: Mask;
}

export default function MaskedInput({
  label,
  style,
  outlineStyle,
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
      <Text style={tw`text-gray text-sm font-medium leading-loose`}>{label}</Text>
      <MaskInput
        value={value}
        onChangeText={(masked, unmasked) => {
          onChangeText?.(unmasked);
        }}
        mask={mask}
        keyboardType="numeric"
        style={[
          tw.style(
            "rounded-xl h-12 border border-[#D2D5DA] py-2 px-4 w-full bg-white text-base",
            error ? "border-red-500" : "border-gray-300",
          ),
          outlineStyle,
          style,
        ]}
        placeholder={placeholder}
        {...rest}
      />
      <HelperText
        type="error"
        visible={error}
        style={{
          height: error ? "auto" : 0,
        }}>
        {errorMessage}
      </HelperText>
    </View>
  );
}
