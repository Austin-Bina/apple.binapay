import { TextInput, View, Animated, Platform } from "react-native";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { HelperText, Text, useTheme } from "react-native-paper";
import tw from "@lib/tailwind";
import { scale } from "react-native-size-matters";
import { Control, useController } from "react-hook-form";

type OtpInputProps = {
  control: Control<any>;
  name: string;
  maximumLength?: number;
  secureTextEntry?: boolean;
};

const OtpInput = ({ 
  control, 
  name = "pin", 
  maximumLength = 6,
  secureTextEntry = true 
}: OtpInputProps) => {
  const {
    field: { onChange, value },
    fieldState: { error },
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

  // Animation for input focus
  const animatedValues = useRef(arrayInput.map(() => new Animated.Value(1))).current;
  const [focused, setFocused] = useState(false);

  // Animate the cell that should receive input
  useEffect(() => {
    if (value.length < maximumLength) {
      const currentIndex = value.length;
      Animated.sequence([
        Animated.timing(animatedValues[currentIndex], {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValues[currentIndex], {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [value]);

  const handleTextChange = (text: string) => {
    const newValue = text.replace(/\D/g, "").slice(0, maximumLength);
    onChange(newValue);
  };

  const inputRef = useRef<TextInput>(null);
  useEffect(() => {
  if (value === "" && focused === false) {
    // Small delay to let the keyboard fully dismiss before re-focusing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }
}, [value]);

  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);

  return (
    <View>
      <View style={tw`flex flex-row items-center justify-center gap-2 md:gap-3`}>
        {arrayInput.map((_, index) => {
          const isFilled = index < value.length;
          const isActive = value.length === index;
          
          return (
            <Animated.View
              key={index}
              style={[
                tw`rounded-xl md:rounded-2xl border items-center justify-center`,
                {
                  borderColor: isActive ? primary : isFilled ? primary : "#B8B8D2",
                  borderWidth: isActive ? 2 : 1,
                  width: scale(maximumLength <= 4 ? 50 : 40),
                  height: scale(maximumLength <= 4 ? 50 : 40),
                  transform: [{ scale: animatedValues[index] }],
                  backgroundColor: isActive && focused ? tw.color('primary-200') : 'transparent',
                },
              ]}>
              {isFilled ? (
                secureTextEntry ? (
                  <View style={tw`w-3 h-3 md:w-4 md:h-4 bg-gray-800 rounded-full`} />
                ) : (
                  <Text style={{ fontSize: scale(16), fontWeight: "600" }}>{value[index]}</Text>
                )
              ) : null}
            </Animated.View>
          );
        })}
      </View>
      <TextInput
      ref={inputRef}
        value={value}
        onChangeText={handleTextChange}
        maxLength={maximumLength}
        keyboardType="numeric"
        secureTextEntry={Platform.OS !== 'web' ? secureTextEntry : false}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          width: "100%",
          backgroundColor: "transparent",
          borderWidth: 0,
          padding: 13,
          paddingVertical: 10,
          color: "transparent",
          position: "absolute",
          fontSize: 24,
          letterSpacing: 40,
          opacity: 0,
        }}
        placeholderTextColor="#B8B8D2"
        placeholder="Enter OTP"
        autoFocus
      />
      {error?.message && (
        <HelperText type="error" style={tw`text-sm text-center mt-2`}>
          {error.message}
        </HelperText>
      )}
    </View>
  );
};

export default OtpInput;
