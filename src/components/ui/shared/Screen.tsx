import { StyleProp, ViewStyle } from "react-native";
import React, { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "@lib/tailwind";

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  withBackgroundImage?: boolean;
}
const Screen = ({ children, style }: Props) => {
  return (
    <SafeAreaView
      style={[tw`flex-1 bg-white`, style]}
      edges={["right", "bottom", "left"]}
    >
      {children}
    </SafeAreaView>
  );
};

export default Screen;
