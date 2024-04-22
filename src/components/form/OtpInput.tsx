import { TextInput, View } from "react-native";
import React, { useMemo } from "react";
import { Text, useTheme } from "react-native-paper";
import tw from "@lib/tailwind";

type OtpInputProps = {
  code: string;
  maximumLength?: number;
  setCode: React.Dispatch<React.SetStateAction<string>>;
};

const OtpInput = ({
  code = "123456",
  maximumLength = 6,
  setCode,
}: OtpInputProps) => {
  const arrayInput = useMemo(() => {
    return Array.from(Array(maximumLength).keys());
  }, [maximumLength]);

  const {
    colors: { primary },
  } = useTheme();

  return (
    <View style={{ width: "80%" }}>
      <View style={tw`flex flex-row items-center justify-center gap-3`}>
        {arrayInput.map((_, index) => (
          <View
            key={index}
            style={[
              tw`w-12 h-12 rounded-2xl border items-center justify-center`,
              {
                borderColor: code.length === index ? primary : "#B8B8D2",
              },
            ]}
          >
            <Text style={{ fontSize: 22, fontWeight: "600" }}>
              {code[index]}
            </Text>
          </View>
        ))}
      </View>
      <TextInput
        value={code}
        onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
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
      />
    </View>
  );
};
export default OtpInput;
