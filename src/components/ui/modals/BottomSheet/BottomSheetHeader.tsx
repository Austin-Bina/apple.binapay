import { SheetModalClose } from "@components/icons/svg";
import { Colors } from "@constants/theme/colors";
import tw from "@lib/tailwind";
import React, { FC } from "react";
import { View } from "react-native";
import { IconButton, MD3Theme, Text } from "react-native-paper";
import { s } from "react-native-size-matters";

interface BottomSheetModalHeaderProps {
  title?: string;
  closeModal?: () => void;
  colors: MD3Theme["colors"];
}

const BottomSheetModalHeader: FC<BottomSheetModalHeaderProps> = ({ title, closeModal, colors }) => {
  return (
    <View style={tw`px-4 flex-row items-center justify-between`}>
      <Text style={tw`text-center`}>{title}</Text>
      <IconButton
        icon={(props) => <SheetModalClose {...props} color={Colors.gray[500]} />}
        iconColor={colors.error}
        size={s(36)}
        style={tw`m-0`}
        onPress={closeModal}
      />
    </View>
  );
};

export default BottomSheetModalHeader;
