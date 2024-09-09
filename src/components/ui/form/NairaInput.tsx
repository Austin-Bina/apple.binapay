import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import React from "react";
import { Control, useController } from "react-hook-form";
import { View } from "react-native";
import CurrencyInput from "react-native-currency-input";
import { HelperText, TextInput } from "react-native-paper";

interface Props {
  control: Control<any>;
  name: string;
}

const NairaInput: React.FC<Props> = ({ control, name }) => {
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({ control, name, defaultValue: 0 });

  return (
    <CurrencyInput
      prefix="₦"
      delimiter=","
      separator="."
      precision={2}
      onBlur={onBlur}
      onChangeValue={onChange}
      value={Number.parseFloat(value)}
      renderTextInput={({ selectionColor, cursorColor, ...props }) => (
        <View>
          <TextInput
            style={[
              tw`text-center w-full bg-white mt-6 py-1`,
              { textAlign: "center" },
            ]}
            contentStyle={tw`font-bold text-2xl text-gray-700`}
            outlineStyle={tw.style(
              "rounded-2xl",
              !!error ? "border-red-500" : "border-gray-300"
            )}
            mode="outlined"
            value={value}
            keyboardType="numeric"
            cursorColor={Colors.primary[600]}
            selectionColor={Colors.primary[400]}
            {...props}
          />
          {error && <HelperText type="error">{error.message}</HelperText>}
        </View>
      )}
    />
  );
};

export default NairaInput;
