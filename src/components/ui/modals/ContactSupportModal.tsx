import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { View, useWindowDimensions, Keyboard, Linking, Alert } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import BottomSheetModal from "./BottomSheet/BottomSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import tw from "@lib/tailwind";
import { scale, vs } from "react-native-size-matters";
import { Phone, MessageCircle, Ticket } from "lucide-react-native";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { SCREENS } from "@constants/screens";
import SupportIcon from "@assets/icons/support-head.svg";
import { Action } from "@components/screens/account";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackParamList, TabParamList } from "@navigators/types";

interface Props {
  show: boolean;
  hide: () => void;
  contact: {
    whatsapp: string;
    phone: string;
    support_url: string;
  } | null;
}

export default function ContactSupportModal({ show, hide, contact }: Props) {
  const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
  const { height } = useWindowDimensions();


const navigation = useNavigation<
  CompositeNavigationProp<
    NativeStackNavigationProp<StackParamList, typeof SCREENS.MAIN>,
    BottomTabNavigationProp<TabParamList>
  >
>();


  const snapPoints = useMemo(() => {
    const dynamicHeight = Math.min(vs(height * 0.5), vs(350));
    return [dynamicHeight, dynamicHeight];
  }, [height]);

  const openBottomSheet = useCallback(() => bottomSheetRef.current?.present(), []);
  const closeBottomSheet = useCallback(() => bottomSheetRef.current?.dismiss(), []);

  useEffect(() => {
    if (show) {
      Keyboard.dismiss();
      setTimeout(() => openBottomSheet(), 120);
    } else {
      closeBottomSheet();
    }
  }, [show]);

  // ✅ Actions
  const handleWhatsApp = async () => {
    if (!contact?.whatsapp) {
      return Alert.alert("Unavailable", "WhatsApp contact is not set.");
    }
    const url = `https://wa.me/${contact.whatsapp}`;
    try {
                  hide();

      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Unable to open WhatsApp.");
    }
  };

  const handlePhoneCall = async () => {
    if (!contact?.phone) {
      return Alert.alert("Unavailable", "Phone number is not set.");
    }
    const url = `tel:${contact.phone}`;
    try {
                  hide();

      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Unable to initiate phone call.");
    }
  };


  if (!contact) return null;

  return (
    <BottomSheetModal ref={bottomSheetRef} initialSnapPoints={snapPoints} onDismiss={hide}>
      <View>
        <View style={tw`px-4 mb-4`}>
          <Text style={tw`text-xl font-bold text-gray-800`}>Contact Support</Text>
          <Text style={tw`text-sm text-gray-500`}>Choose how you’d like to reach us</Text>
        </View>

        {/* WhatsApp */}
        <TouchableRipple onPress={handleWhatsApp} style={tw`my-1`}>
          <View style={tw`flex-row items-center px-4 py-3`}>
            <MessageCircle width={24} height={24} style={tw`mr-3`} color="#25D366" />
            <Text style={tw`text-base font-medium text-gray-800`}>WhatsApp</Text>
          </View>
        </TouchableRipple>

        {/* Phone Call */}
        <TouchableRipple onPress={handlePhoneCall} style={tw`my-1`}>
          <View style={tw`flex-row items-center px-4 py-3`}>
            <Phone width={24} height={24} style={tw`mr-3`} color="#2563EB" />
            <Text style={tw`text-base font-medium text-gray-800`}>Call Us</Text>
          </View>
        </TouchableRipple>

        {/* Ticket */}
        <Action
          title="Live Chat"
          ItemIcon={SupportIcon}
         onPress={() => {
       closeBottomSheet();
         hide();
      setTimeout(() => {
      navigation.navigate(SCREENS.MAIN, {
  screen: SCREENS.HOME,
  params: {
    screen: SCREENS.SUPPORT_STACK,
    params: { screen: SCREENS.DEPARTMENT_AND_HISTORY_TAB },
  },
});

       }, 150);
       }}
        />
      </View>
    </BottomSheetModal>
  );
}
