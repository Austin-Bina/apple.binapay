import { Platform, StyleProp, ViewStyle } from "react-native";
import React, { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "@lib/tailwind";

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  withBackgroundImage?: boolean;
}
const Screen = ({ children, style }: Props) => {
  const iosEdges = ["right", "left"] as const;
  const otherEdges = ["right", "left"] as const;
  const edges = Platform.OS === "ios" ? iosEdges : otherEdges;

  return (
    <SafeAreaView style={[tw`flex-1 bg-white`, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

export default Screen;
