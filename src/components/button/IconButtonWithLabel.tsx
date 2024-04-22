import tw from "@lib/tailwind";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { SvgProps } from "react-native-svg";

interface Props extends Omit<React.ComponentProps<typeof Icon>, "source"> {
  label: string;
  RenderIcon?: React.FC<SvgProps>;
  source?: any;
  onPress: () => void;
}

export default function IconButtonWithLabel({
  label,
  RenderIcon,
  source,
  size,
  onPress,
  ...rest
}: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={tw`items-center w-1/3`}>
      <View
        style={tw`justify-center h-14 w-14 items-center p-4 bg-primary-50 rounded-full mb-2`}
      >
        {RenderIcon ? (
          <RenderIcon width={size} height={size} />
        ) : (
          <Icon source={source} size={size} {...rest} />
        )}
      </View>
      <View style={tw`items-center`}>
        {label.split("+").map((word, index) => (
          <Text
            key={index}
            style={tw`text-gray-900 text-xs font-medium text-center w-full`}
          >
            {word}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
}
