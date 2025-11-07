import { AngledRightArrow } from "@components/icons/svg";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import tw from "@lib/tailwind";
import React, { useCallback, useEffect, useRef } from "react";
import { Keyboard, View, useWindowDimensions } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import BottomSheetModal from "./BottomSheet/BottomSheet";
import { Image } from "react-native-element-image";
import { scale, vs } from "react-native-size-matters";

interface Props {
  show: boolean;
  hide: () => void;
  navigation: {
    handleWithdrawCrypto: () => void;
    handleWithdrawNaira: () => void;
  };
}

export default function WithdrawFundsSheet({ show, hide, navigation }: Props) {
  const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
  const { height } = useWindowDimensions();

  const openBottomSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  useEffect(() => {
    if (show) {
      if (Keyboard.isVisible()) Keyboard.dismiss();

      setTimeout(() => openBottomSheet(), 100);
    } else {
      closeBottomSheet();
    }
  }, [show, hide]);

  const snapPoints = React.useMemo(() => {
    const dynamicHeight = Math.min(vs(height * 0.5), vs(400));
    return [dynamicHeight, dynamicHeight];
  }, [height]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      initialSnapPoints={snapPoints}
      onDismiss={hide}
      children={
        <View>
          <View style={tw`px-4 sm:px-6 md:px-8 mb-6 sm:mb-8 md:mb-[36px]`}>
            <Text style={tw`text-xl sm:text-2xl font-bold text-gray-800`}>Withdrawal Options</Text>
            <Text style={tw`text-sm sm:text-base font-normal text-gray-500`}>
              Select withdrawal method
            </Text>
          </View>

          {/* Withdraw Crypto */}
          <TouchableRipple onPress={navigation.handleWithdrawCrypto} style={tw`my-0.5 sm:my-1`}>
            <View style={tw`flex-row justify-between items-center px-4 sm:px-6 md:px-8 my-1 py-2 sm:py-3`}>
              <View style={tw`flex-row items-center gap-2 sm:gap-3`}>
                <Image
                  source={require("@assets/icons/building-blocks-outline.png")}
                  width={scale(36)}
                  height={scale(36)}
                  style={tw`w-9 h-9 sm:w-12 sm:h-12`}
                />
                <Text style={tw`text-sm sm:text-base font-medium`}>Withdraw Crypto</Text>
              </View>
              <AngledRightArrow width={16} height={16} style={tw`w-4 h-4 sm:w-5 sm:h-5`} />
            </View>
          </TouchableRipple>

          {/* Withdraw Naira */}
          <TouchableRipple onPress={navigation.handleWithdrawNaira} style={tw`my-0.5 sm:my-1`}>
            <View style={tw`flex-row justify-between items-center px-4 sm:px-6 md:px-8 my-1 py-2 sm:py-3`}>
              <View style={tw`flex-row items-center gap-2 sm:gap-3`}>
                <Image
                  source={require("@assets/icons/building-blocks-outline.png")}
                  width={scale(36)}
                  height={scale(36)}
                  style={tw`w-9 h-9 sm:w-12 sm:h-12`}
                />
                <Text style={tw`text-sm sm:text-base font-medium`}>Withdraw Naira</Text>
              </View>
              <AngledRightArrow width={16} height={16} style={tw`w-4 h-4 sm:w-5 sm:h-5`} />
            </View>
          </TouchableRipple>
        </View>
      }
    />
  );
}
