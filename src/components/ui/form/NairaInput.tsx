import React, { useState, useRef } from "react";
import { View, Text, TextInput, TouchableWithoutFeedback, Platform } from "react-native";
import { Control, useController } from "react-hook-form";
import { formatToNaira } from "@utils/money";
import tw from "@lib/tailwind";
import { HelperText } from "react-native-paper";

interface Props {
  control: Control<any>;
  name: string;
  isDisabled?: boolean;
}

const NairaInput: React.FC<Props> = ({ control, name, isDisabled }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({ control, name, defaultValue: "" });

  const handleChangeText = (text: string) => {
    onChange(text.replace(/[^0-9]/g, ""));
  };

  const handleFocus = () => {
    setIsFocused(true);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <TouchableWithoutFeedback onPress={handleFocus} disabled={isDisabled}>
      <View style={tw`w-full relative`}>
        <View
          style={tw`w-full bg-white mt-6 py-2 rounded-2xl border min-h-16 flex items-center justify-center
            ${isFocused ? "border-blue-500" : "border-gray-300"}`}>
          <Text style={tw`font-bold text-3xl text-gray-700 text-center`}>{formatToNaira(value)}</Text>
        </View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="numeric"
          editable={!isDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[tw`absolute inset-0 opacity-0 text-center bg-red`, Platform.OS === "web" && tw`cursor-default`]}
          caretHidden={true}
        />
        {error && <HelperText type="error">{error.message}</HelperText>}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default NairaInput;
