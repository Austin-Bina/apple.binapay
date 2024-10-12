import { Platform, StyleProp, View, ViewStyle } from "react-native";
import React, { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "@lib/tailwind";

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  withBackgroundImage?: boolean;
}
const Screen = ({ children, style }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        tw`flex-1 bg-white`,
        {
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}>
      {children}
    </View>
  );
};

export default Screen;
