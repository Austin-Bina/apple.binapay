import React, { useEffect, useRef } from "react";
import { Animated, View, Easing, ViewStyle } from "react-native";
import tw from "@lib/tailwind";

type Props = {
  width?: number | `${number}%`; // allow number (px) or percentage
  height?: number;
};

export default function AnimatedBalanceLoader({ width = 80, height = 20 }: Props) {
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const startShake = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 100,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -1,
          duration: 100,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    startShake();
  }, []);

  const translateX = shakeAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: [-5, 5],
  });

  // Separate animated styles (translateX) from static styles (width/height)
  const animatedStyle: ViewStyle = {
    transform: [{ translateX }],
  };

  const staticStyle: ViewStyle =
    typeof width === "string"
      ? { width, height } // percentages
      : { width: width as number, height }; // pixel numbers

  return <Animated.View style={[tw`bg-gray-300 rounded-md`, staticStyle, animatedStyle]} />;
}
