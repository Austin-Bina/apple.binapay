import { TextInput, View } from "react-native";
import React, { useMemo, useState } from "react";
import { Text, useTheme } from "react-native-paper";
import tw from "@lib/tailwind";
import { scale } from "react-native-size-matters";

type OtpInputProps = {
  code: string;
  maximumLength?: number;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  error?: string;
};

const OtpInput = ({ code = "", maximumLength = 6, setCode }: OtpInputProps) => {
  const [inputValue, setInputValue] = useState(code);
  const arrayInput = useMemo(() => {
    return Array.from(Array(maximumLength).keys());
  }, [maximumLength]);

  const {
    colors: { primary },
  } = useTheme();

  const handleTextChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9]/g, "");
    setInputValue(cleanedText);
    setCode(cleanedText);
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
                borderColor: inputValue.length === index ? primary : "#B8B8D2",
                width: scale(40),
                height: scale(40)
              },
            ]}
          >
            <Text style={{ fontSize: 22, fontWeight: "600" }}>
              {inputValue[index] || ""}
            </Text>
          </View>
        ))}
      </View>
      <TextInput
        value={inputValue}
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
