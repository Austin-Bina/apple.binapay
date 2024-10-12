import React from "react";
import { ButtonProps, Button as PaperButton } from "react-native-paper"; // Assuming you are using react-native-paper for buttons
import { View } from "react-native";
import tw from "@lib/tailwind";

export interface CustomButtonProps extends ButtonProps {}

const CustomButton: React.FC<CustomButtonProps> = ({
  onPress,
  style,
  contentStyle,
  mode = "contained",
  icon,
  children,
  ...rest
}) => {
  return (
    <View>
      <PaperButton
        mode={mode}
        onPress={onPress}
        style={[tw`rounded-full`, style]}
        contentStyle={[tw`py-2`, contentStyle]}
        icon={icon}
        {...rest}>
        {children}
      </PaperButton>
    </View>
  );
};

export default CustomButton;
