import React, { useMemo } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text } from "react-native-paper";
import { Control } from "react-hook-form";
import NairaInput from "@components/ui/form/NairaInput";
import WalletBalanceHelper from "@components/ui/form/wallet-balance";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

interface PaymentSectionProps {
  control: Control<any>;
  dataAmount: string;
  walletValidation: any;
}

const PaymentSection = ({ control, dataAmount, walletValidation }: PaymentSectionProps) => {
  const fadeAnim  = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    if (dataAmount) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [dataAmount]);

  const walletBalanceComponent = useMemo(() => (
    <WalletBalanceHelper {...walletValidation} />
  ), [walletValidation]);

  return (
    <View style={s.wrap}>
      {/* Amount input card */}
      <Text style={s.sectionLabel}>Payment</Text>
      <View style={s.card}>
        <NairaInput name="amount" control={control} isDisabled />
      </View>

      {/* Wallet balance */}
      <View style={s.balanceWrap}>
        {walletBalanceComponent}
      </View>

      {/* Bundle summary */}
      {dataAmount && (
        <Animated.View style={[s.summaryCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={s.summaryHeader}>
            <MaterialCommunityIcons name="package-variant-closed" size={15} color="#16A34A" />
            <Text style={s.summaryHeaderText}>Bundle Summary</Text>
          </View>
          <View style={s.summaryRow}>
            <View style={s.summaryIconWrap}>
              <MaterialCommunityIcons name="database-outline" size={18} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.summaryLabel}>You will receive</Text>
              <Text style={s.summaryValue}>{dataAmount}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default React.memo(PaymentSection);

const s = StyleSheet.create({
  wrap:             { marginBottom: 20 },
  sectionLabel:     { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 2 },
  card:             { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", paddingHorizontal: 14, paddingVertical: 4, marginBottom: 10 },
  balanceWrap:      { marginBottom: 8 },
  summaryCard:      { backgroundColor: "#f0fdf4", borderRadius: 14, borderWidth: 1, borderColor: "#bbf7d0", overflow: "hidden", marginTop: 4 },
  summaryHeader:    { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#bbf7d0" },
  summaryHeaderText:{ fontSize: 13, fontWeight: "700", color: "#15803d" },
  summaryRow:       { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  summaryIconWrap:  { width: 38, height: 38, borderRadius: 19, backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center" },
  summaryLabel:     { fontSize: 11, color: "#16a34a", marginBottom: 2 },
  summaryValue:     { fontSize: 15, fontWeight: "700", color: "#15803d" },
});
