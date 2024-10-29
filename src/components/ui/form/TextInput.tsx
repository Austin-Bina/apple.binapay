import React, { forwardRef } from "react";
import { HelperText, TextInput as PaperTextInput, type TextInputProps } from "react-native-paper";
import tw from "@lib/tailwind";
import { Text, TextInput, View } from "react-native";
import { Colors } from "@constants/theme/colors";

interface CustomTextInputProps extends TextInputProps {
  errorMessage?: string;
}

const CustomTextInput = forwardRef<TextInput, CustomTextInputProps>(
  ({ label, style, outlineStyle, error, errorMessage, mode = "outlined", ...rest }, ref) => (
    <View>
      <Text style={tw`text-gray text-sm font-medium leading-loose`}>{label}</Text>
      <PaperTextInput
        style={[tw`w-full bg-white`, style]}
        outlineStyle={[tw.style("rounded-2xl", error ? "border-red-500" : "border-gray-300"), outlineStyle]}
        placeholderTextColor={Colors.gray[400]}
        mode={mode}
        ref={ref}
        error={error}
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
  )
);

CustomTextInput.displayName = 'CustomTextInput';

export default CustomTextInput;
