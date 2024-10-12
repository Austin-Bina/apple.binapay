import { AngledRightArrow } from "@components/icons/svg";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import tw from "@lib/tailwind";
import React, { useCallback, useEffect, useRef } from "react";
import { Keyboard, View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import BottomSheetModal from "./BottomSheet/BottomSheet";
import { Image } from "react-native-element-image";
import { scale, vs } from "react-native-size-matters";

interface Props {
  show: boolean;
  hide: () => void;
  navigation: {
    handleFundWithBank: () => void;
    handleFundWithCard: () => void;
    handleManualFund: () => void;
  };
}

export default function FundAccountSheet({ show, hide, navigation }: Props) {
  const bottomSheetRef = useRef<BottomSheetModalMethods>(null);

  const openBottomSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  useEffect(() => {
    if (show) {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss();
      }

      setTimeout(() => {
        openBottomSheet();
      }, 100);
    } else {
      closeBottomSheet();
    }
  }, [show, hide]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      initialSnapPoints={[vs(335), vs(335)]}
      onDismiss={hide}
      children={
        <View>
          <View style={tw`px-4 mb-[36px]`}>
            <Text style={tw`text-2xl font-bold text-gray-800`}>Funding Options</Text>
            <Text style={tw`text-base font-normal text-gray-500`}>Select funding option</Text>
          </View>
          <TouchableRipple onPress={navigation.handleFundWithBank} style={tw`my-1`}>
            <View style={tw`flex-row justify-between items-center px-4 my-1`}>
              <View style={tw`flex-row items-center gap-3`}>
                <Image
                  source={require("@assets/icons/bank-building-outline.png")}
                  width={scale(48)}
                  height={scale(48)}
                />
                <Text style={tw`text-base font-medium`}>Bank Transfer</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <AngledRightArrow width={20} />
              </View>
            </View>
          </TouchableRipple>
          <TouchableRipple onPress={navigation.handleManualFund} style={tw`my-1`}>
            <View style={tw`flex-row justify-between items-center px-4 my-1`}>
              <View style={tw`flex-row items-center gap-3`}>
                <Image
                  source={require("@assets/icons/building-blocks-outline.png")}
                  width={scale(48)}
                  height={scale(48)}
                />
                <Text style={tw`text-base font-medium`}>Manual Fund</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <AngledRightArrow width={20} />
              </View>
            </View>
          </TouchableRipple>
          <TouchableRipple onPress={navigation.handleFundWithCard} style={tw`my-1`}>
            <View style={tw`flex-row justify-between items-center px-4 my-1`}>
              <View style={tw`flex-row items-center gap-3`}>
                <Image source={require("@assets/icons/card-outline.png")} width={scale(48)} height={scale(48)} />
                <Text style={tw`text-base font-medium`}>Card</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <AngledRightArrow width={20} />
              </View>
            </View>
          </TouchableRipple>
        </View>
      }
    />
  );
}
