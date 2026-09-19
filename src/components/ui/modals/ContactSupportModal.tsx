import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { View, useWindowDimensions, Keyboard, Linking, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import BottomSheetModal from "./BottomSheet/BottomSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { scale, vs } from "react-native-size-matters";
import { Phone, MessageCircle, ChevronRight, Headset } from "lucide-react-native";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { SCREENS } from "@constants/screens";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackParamList, TabParamList } from "@navigators/types";
import { showToast } from "@helpers/toast";

const BLUE = "#2563EB";

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
    const dynamicHeight = Math.min(vs(height * 0.5), vs(330));
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

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleWhatsApp = async () => {
    if (!contact?.whatsapp) {
      return showToast({ message: "WhatsApp contact is not set.", variant: "error" });
    }
    const url = (contact.whatsapp);
    
    try {
      hide();
      await Linking.openURL(url);
    } catch (error) {
      
      showToast({ message: "Unable to open WhatsApp.", variant: "error" });
    }
  };

  const handlePhoneCall = async () => {
   

    if (!contact?.phone) {
      return showToast({ message: "Phone number is not set.", variant: "error" });
    }
    const url = `tel:${contact.phone}`;
    try {
      hide();
      await Linking.openURL(url);
    } catch (error) {
      console.log("[ContactSupportModal] Linking.openURL failed for:", url, error);
      showToast({ message: "Unable to initiate phone call.", variant: "error" });
    }
  };

  const handleLiveChat = () => {
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
  };

  if (!contact) return null;

  return (
    <BottomSheetModal ref={bottomSheetRef} initialSnapPoints={snapPoints} onDismiss={hide}>
      <View style={s.container}>
        <Text style={s.title}>Contact Support</Text>
        <Text style={s.subtitle}>Choose how you'd like to reach us</Text>

        {/* Live Chat / Ticket */}
        <TouchableOpacity style={s.optionRow} onPress={handleLiveChat} activeOpacity={0.7}>
          <View style={[s.iconWrap, { backgroundColor: "#FFF3E0" }]}>
            <Headset width={22} height={22} color="#F5A623" />
          </View>
          <View style={s.optionText}>
            <Text style={s.optionTitle}>Live Chat</Text>
            <Text style={s.optionSub}>Chat with our support team</Text>
          </View>
          <ChevronRight width={20} height={20} color="#9ca3af" />
        </TouchableOpacity>
          
        <View style={s.divider} />

        {/* Phone Call */}
        <TouchableOpacity style={s.optionRow} onPress={handlePhoneCall} activeOpacity={0.7}>
          <View style={[s.iconWrap, { backgroundColor: "#EEF3FF" }]}>
            <Phone width={22} height={22} color={BLUE} />
          </View>
          <View style={s.optionText}>
            <Text style={s.optionTitle}>Call Us</Text>
            <Text style={s.optionSub}>Speak directly with our team</Text>
          </View>
          <ChevronRight width={20} height={20} color="#9ca3af" />
        </TouchableOpacity>

          <View style={s.divider} />

         {/* WhatsApp */}
        <TouchableOpacity style={s.optionRow} onPress={handleWhatsApp} activeOpacity={0.7}>
          <View style={[s.iconWrap, { backgroundColor: "#E7F9EF" }]}>
            <MessageCircle width={22} height={22} color="#25D366" />
          </View>
          <View style={s.optionText}>
            <Text style={s.optionTitle}>WhatsApp</Text>
            <Text style={s.optionSub}>Join BinaPay WhatsApp Channel</Text>
          </View>
          <ChevronRight width={20} height={20} color="#9ca3af" />
        </TouchableOpacity>

      </View>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  container:   { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
  title:       { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 4 },
  subtitle:    { fontSize: 13, color: "#6b7280", marginBottom: 24 },
  optionRow:   { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  iconWrap:    { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  optionText:  { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 3 },
  optionSub:   { fontSize: 12, color: "#6b7280" },
  divider:     { height: 1, backgroundColor: "#f3f4f6" },
});
