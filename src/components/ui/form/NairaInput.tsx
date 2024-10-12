import tw from "@lib/tailwind";
import React from "react";
import { Control, useController } from "react-hook-form";
import { Platform, View } from "react-native";
import { TextInputMask } from "react-native-masked-text";
import { HelperText } from "react-native-paper";

interface Props {
  control: Control<any>;
  name: string;
  isDisabled?: boolean;
}

const NairaInput: React.FC<Props> = ({ control, name, isDisabled }) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({ control, name, defaultValue: 0 });

  return (
    <View>
      <TextInputMask
        type={"money"}
        options={{
          precision: 2,
          delimiter: ",",
          separator: ".",
          unit: "₦",
        }}
        includeRawValueInChangeText={true}
        editable={!isDisabled}
        value={value}
        multiline={Platform.OS === "android" ? true : false}
        numberOfLines={Platform.OS === "android" ? 1 : undefined}
        blurOnSubmit={true}
        returnKeyType={"done"}
        style={[
          tw.style(
            "text-center w-full bg-white mt-6 py-2 font-bold",
            "text-3xl text-gray-700 rounded-2xl border min-h-16",
            !!error ? "border-red-500" : "border-gray-300",
          ),
        ]}
        onChangeText={(text, rawText) => {
          onChange(rawText);
        }}
      />
      {error && <HelperText type="error">{error.message}</HelperText>}
    </View>
  );
};

export default NairaInput;
