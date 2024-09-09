import { TextInput, View } from "react-native";
import React, { useMemo, useState } from "react";
import { Text, useTheme } from "react-native-paper";
import tw from "@lib/tailwind";
import { scale } from "react-native-size-matters";
import { Control, useController } from "react-hook-form";

type OtpInputProps = {
  control: Control<any>;
  name: string;
  maximumLength?: number;
};

const OtpInput = ({ control, name = "pin", maximumLength = 6 }: OtpInputProps) => {
  const {
    field: { onChange, value },
  } = useController({
    control,
    name,
    defaultValue: "",
  });

  const arrayInput = useMemo(() => {
    return Array.from(Array(maximumLength).keys());
  }, [maximumLength]);

  const {
    colors: { primary },
  } = useTheme();

  const handleTextChange = (text: string) => {
    const newValue = text.replace(/\D/g, "").slice(0, maximumLength);
    onChange(newValue);
  };

  return (
    <View>
      <View style={tw`flex flex-row items-center justify-center gap-3`}>
        {arrayInput.map((_, index) => (
          <View
            key={index}
            style={[
              tw`rounded-2xl border items-center justify-center`,
              {
                borderColor: value.length === index ? primary : "#B8B8D2",
                width: scale(40),
                height: scale(40),
              },
            ]}>
            <Text style={{ fontSize: 22, fontWeight: "600" }}>{value[index] || ""}</Text>
          </View>
        ))}
      </View>
      <TextInput
        value={value}
        onChangeText={handleTextChange}
        maxLength={maximumLength}
        keyboardType="numeric"
        showSoftInputOnFocus={true}
        style={{
          width: "100%",
          backgroundColor: "black",
          borderWidth: 1,
          padding: 13,
          paddingVertical: 10,
          color: "white",
          position: "absolute",
          fontSize: 24,
          letterSpacing: 40,
          opacity: 0,
        }}
        placeholderTextColor="#B8B8D2"
        placeholder="Enter OTP"
      />
    </View>
  );
};

export default OtpInput;
