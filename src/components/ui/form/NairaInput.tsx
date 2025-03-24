import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, Platform, Pressable, Animated, Keyboard } from "react-native";
import { Control, useController } from "react-hook-form";
import { formatToNaira } from "@utils/money";
import tw from "@lib/tailwind";
import { HelperText } from "react-native-paper";

interface NairaInputProps {
  control: Control<any>;
  name: string;
  isDisabled?: boolean;
  label?: string;
  placeholder?: string;
}

const NairaInput: React.FC<NairaInputProps> = ({
  control,
  name,
  isDisabled = false,
  label,
  placeholder = "₦0.00"
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const {
    field: { onChange, value, onBlur },
    fieldState: { error },
  } = useController({ control, name, defaultValue: "" });

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isFocused, animatedValue]);

  const handleChangeText = (text: string) => {
    onChange(text.replace(/[^0-9]/g, ""));
  };

  const handlePress = () => {
    if (!isDisabled) {
      inputRef.current?.focus();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur();
  };

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgb(209, 213, 219)', 'rgb(59, 130, 246)'],
  });

  const shadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <View style={tw`w-full max-w-md mx-auto`}>
      {label && (
        <Text style={tw`text-sm font-medium text-gray-700 mb-1 ml-1`}>
          {label}
        </Text>
      )}
      
      <Pressable 
        onPress={handlePress}
        style={tw`w-full relative`}
        pointerEvents="box-only"
      >
        <Animated.View
          style={[
            tw`w-full bg-white py-3 px-4 rounded-xl min-h-16 flex items-center justify-center overflow-hidden`,
            {
              borderWidth: 1,
              borderColor,
              transform: [{ scale }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity,
              shadowRadius: 8,
              elevation: isFocused ? 3 : 0,
            }
          ]}
        >
          <Text style={tw`font-bold ${value ? 'text-3xl' : 'text-2xl opacity-50'} text-gray-800 text-center`}>
            {value ? formatToNaira(value) : placeholder}
          </Text>
        </Animated.View>
        
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="numeric"
          editable={!isDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={`${label} input field`}
          style={[
            tw`absolute inset-0 opacity-0 text-center`,
            Platform.OS === "web" && tw`cursor-text`
          ]}
          caretHidden={true}
        />
      </Pressable>
      
      {error && (
        <HelperText type="error" style={tw`mt-1 text-red-500 font-medium`}>
          {error.message}
        </HelperText>
      )}
    </View>
  );
};

export default NairaInput;
