import { View, Animated, useWindowDimensions } from "react-native";
import React from "react";
import tw from "@lib/tailwind";

const Paginator = ({ data, scrollX }: any) => {
  const { width } = useWindowDimensions();

  return (
    <View style={tw`flex flex-row justify-center mb-16`}>
      {data.map((_: any, i: number) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 40, 10],
          extrapolate: "clamp",
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            style={[
              tw`h-2.5 rounded-md bg-primary mx-2`,
              { width: dotWidth, opacity },
            ]}
            key={i}
          />
        );
      })}
    </View>
  );
};

export default Paginator;
