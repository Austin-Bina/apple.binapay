import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import tw from "@lib/tailwind";
import React, { useCallback, useEffect, useRef } from "react";
import { Keyboard, View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import BottomSheetModal from "./BottomSheet/BottomSheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import NairaIcon from "@assets/icons/naira-icon.svg";

const BLUE = "#2563EB";

interface Props {
  show: boolean;
  hide: () => void;
  navigation: {
    handleDepositCrypto: () => void;
    handleFundWithBank: () => void;
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
      if (Keyboard.isVisible()) Keyboard.dismiss();
      setTimeout(() => openBottomSheet(), 100);
    } else {
      closeBottomSheet();
    }
  }, [show]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      initialSnapPoints={["55%", "55%"]}
      onDismiss={hide}
    >
      <View style={s.container}>
        {/* Header */}
        <Text style={s.title}>Add Money</Text>
        <Text style={s.subtitle}>Choose how you want to add money</Text>

        {/* Add Naira */}
        <TouchableOpacity
          style={s.optionRow}
          onPress={navigation.handleFundWithBank}
          activeOpacity={0.7}
        >
          <View style={[s.iconWrap, { backgroundColor: "#dcfce7" }]}>
            <NairaIcon width={24} height={24} />
          </View>
          <View style={s.optionText}>
            <Text style={s.optionTitle}>Add Naira</Text>
            <Text style={s.optionSub}>Fund your wallet or account using bank transfer</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <View style={s.divider} />

        {/* Deposit Crypto */}
        <TouchableOpacity
          style={s.optionRow}
          onPress={navigation.handleDepositCrypto}
          activeOpacity={0.7}
        >
          <View style={[s.iconWrap, { backgroundColor: "#EEF3FF" }]}>
            <MaterialCommunityIcons name="bitcoin" size={24} color={BLUE} />
          </View>
          <View style={s.optionText}>
            <Text style={s.optionTitle}>Deposit Crypto</Text>
            <Text style={s.optionSub}>Deposit crypto from another wallet or exchange</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
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
