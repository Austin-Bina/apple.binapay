import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Keyboard } from "react-native";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import NairaIcon from "@assets/icons/naira-icon.svg";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

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

  // ── All original logic — untouched ────────────────────────────────────────
  const openBottomSheet  = useCallback(() => bottomSheetRef.current?.present(), []);
  const closeBottomSheet = useCallback(() => bottomSheetRef.current?.dismiss(),  []);

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
      onDismiss={hide}>

      <View style={s.container}>

        {/* Header */}
        <Text style={s.title}>Add Money</Text>
        <Text style={s.subtitle}>Choose how you want to add money</Text>

        {/* Add Naira */}
        <TouchableOpacity
          style={s.optionRow}
          onPress={navigation.handleFundWithBank}
          activeOpacity={0.7}>
          <View style={[s.iconWrap, { backgroundColor: "#DCFCE7" }]}>
            <NairaIcon width={24} height={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.optionTitle}>Add Naira</Text>
            <Text style={s.optionSub}>Fund your wallet using bank transfer</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={SUBLABEL} />
        </TouchableOpacity>

        <View style={s.hairline} />

        {/* Deposit Crypto */}
        <TouchableOpacity
          style={s.optionRow}
          onPress={navigation.handleDepositCrypto}
          activeOpacity={0.7}>
          <View style={[s.iconWrap, { backgroundColor: BLUE_LIGHT }]}>
            <MaterialCommunityIcons name="bitcoin" size={24} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.optionTitle}>Deposit Crypto</Text>
            <Text style={s.optionSub}>Deposit from another wallet or exchange</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={SUBLABEL} />
        </TouchableOpacity>

      </View>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  container:   { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28 },

  // Header
  title:       { fontSize: 18, fontWeight: "700", color: LABEL, marginBottom: 4 },
  subtitle:    { fontSize: 13, color: SUBLABEL, marginBottom: 24 },

  // Option rows
  optionRow:   { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  iconWrap:    { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  optionTitle: { fontSize: 15, fontWeight: "600", color: LABEL, marginBottom: 3 },
  optionSub:   { fontSize: 12, color: SUBLABEL },

  // Divider
  hairline:    { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR },
});
