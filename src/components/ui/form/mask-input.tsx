import tw from "@lib/tailwind";
import React, { useState } from "react";
import { View, Text, StyleProp, ViewStyle, Animated, NativeSyntheticEvent, TextInputFocusEventData } from "react-native";
import MaskInput, { Mask, MaskInputProps } from "react-native-mask-input";
import { AlertCircle } from "lucide-react-native";

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
  const [isFocused, setIsFocused] = useState(false);
  const animatedOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedOpacity, {
      toValue: error ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [error, animatedOpacity]);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    rest.onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    rest.onBlur?.(e);
  };

  return (
    <View style={tw`mb-1`}>
      {label && (
        <Text 
          style={tw`text-sm font-medium mb-1.5 ${
            isFocused ? 'text-primary' : 'text-gray-700'
          }`}
        >
          {label}
        </Text>
      )}
      
      <View style={tw`relative`}>
        <MaskInput
          value={value}
          onChangeText={(masked, unmasked) => {
            onChangeText?.(unmasked);
          }}
          mask={mask}
          keyboardType="numeric"
          style={[
            tw.style(
              "rounded-xl h-12 border py-2 px-4 w-full bg-white text-base transition-all",
              isFocused && !error && "border-primary border-2 shadow-sm",
              error ? "border-red-500 border-2" : "border-gray-300",
            ),
            style,
          ]}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={tw.color("gray-400")}
          {...rest}
        />
        
        <View style={tw`flex-row items-center mt-1 min-h-[20px]`}>
          {error && errorMessage && (
            <>
              <AlertCircle size={14} color={tw.color("red-500")} style={tw`mr-1`} />
              <Animated.Text 
                style={[
                  tw`text-red-500 text-xs font-medium`,
                  { opacity: animatedOpacity }
                ]}
              >
                {errorMessage}
              </Animated.Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
