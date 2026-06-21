import React, { forwardRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import BottomSheetModal from "../BottomSheet/BottomSheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const BLUE = "#2563EB";
const BRAND = "#1E3A8A";

type Props = {
  mode: "buy" | "sell";
  fromSymbol: string;
  toSymbol: string;
  fromIconUrl?: string;
  toIconUrl?: string;
  From: string;
  To: string;
  Rate: string;
  fee: string;
  youSpend: string;
  youReceive: string;
  estimatedUsd?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConvertCryptoConfirmSheet = forwardRef<any, Props>(
  ({
    mode, fromSymbol, toSymbol, fromIconUrl, toIconUrl,
    From, To, Rate, fee, youSpend, youReceive, estimatedUsd,
    onConfirm, onCancel,
  }, ref) => {

    const isBuy = mode === "buy";
    const accentColor = isBuy ? "#16a34a" : "#7c3aed";
    const accentBg    = isBuy ? "#f0fdf4" : "#f5f3ff";

    return (
      <BottomSheetModal
        ref={ref}
        headerTitle="Review Order"
        initialSnapPoints={["95%"]}
        index={0}
        onDismiss={onCancel}
        enableDynamicSizing={false}
      >
        <View style={s.container}>

          {/* ── Mode badge ── */}
          <View style={[s.modeBadge, { backgroundColor: accentBg }]}>
            <Text style={[s.modeBadgeText, { color: accentColor }]}>
              {isBuy ? "Buy" : "Sell"}
            </Text>
            <View style={s.toIconWrap}>
              {toIconUrl ? (
                <Image source={{ uri: toIconUrl }} style={s.assetIcon} />
              ) : (
                <View style={[s.assetIcon, s.assetIconFallback]}>
                  <Text style={s.assetIconFallbackText}>
                    {toSymbol.toUpperCase().slice(0, 2)}
                  </Text>
                </View>
              )}
              <Text style={s.modeBadgeAsset}>{toSymbol.toUpperCase()}</Text>
            </View>
          </View>

          {/* ── You Spend ── */}
          <Text style={s.amountLabel}>You Spend</Text>
          <Text style={s.amountValue}>{youSpend}</Text>

          {/* ── Arrow ── */}
          <View style={s.arrowWrap}>
            <MaterialCommunityIcons name="arrow-down" size={22} color="#9ca3af" />
          </View>

          {/* ── You Receive ── */}
          <Text style={s.receiveValue}>{youReceive}</Text>
          {estimatedUsd && (
            <Text style={s.estimatedUsd}>≈ {estimatedUsd}</Text>
          )}

          {/* ── Rate badge ── */}
          {Rate ? (
            <View style={s.rateBadge}>
              <Text style={s.rateBadgeText}>Rate: {Rate}</Text>
            </View>
          ) : null}

          {/* ── Details rows ── */}
          <View style={s.detailsCard}>
            <DetailRow label="Payment Method" value="BinaPay Wallet" />
            <DetailRow label="Network Fee" value="Free" highlight />
            <DetailRow label="You Spend" value={youSpend} />
            <DetailRow label="You Receive" value={youReceive} />
          </View>

          {/* ── Secure note ── */}
          <View style={s.secureNote}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={BLUE} />
            <View style={{ flex: 1 }}>
              <Text style={s.secureTitle}>Secure & Instant</Text>
              <Text style={s.secureSub}>
                Your crypto will be available instantly after confirmation.
              </Text>
            </View>
          </View>

          {/* ── Confirm button ── */}
          <TouchableOpacity
            style={[s.confirmBtn, { backgroundColor: isBuy ? BLUE : "#7c3aed" }]}
            onPress={onConfirm}
          >
            <MaterialCommunityIcons name="lock-outline" size={18} color="#fff" />
            <Text style={s.confirmBtnText}>
              {isBuy ? "Confirm & Buy" : "Confirm & Sell"}
            </Text>
          </TouchableOpacity>

        </View>
      </BottomSheetModal>
    );
  }
);

function DetailRow({ label, value, highlight }: {
  label: string; value: string; highlight?: boolean;
}) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, highlight && s.detailValueHighlight]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { paddingHorizontal: 20, paddingBottom: 24 },

  modeBadge:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 20 },
  modeBadgeText:   { fontSize: 16, fontWeight: "700" },
  toIconWrap:      { flexDirection: "row", alignItems: "center", gap: 6 },
  modeBadgeAsset:  { fontSize: 15, fontWeight: "700", color: BRAND },
  assetIcon:       { width: 28, height: 28, borderRadius: 14 },
  assetIconFallback:{ backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  assetIconFallbackText: { fontSize: 10, fontWeight: "700", color: "#6b7280" },

  amountLabel:     { fontSize: 12, color: "#9ca3af", textAlign: "center", marginBottom: 4 },
  amountValue:     { fontSize: 28, fontWeight: "800", color: BRAND, textAlign: "center" },
  arrowWrap:       { alignItems: "center", marginVertical: 10 },
  receiveValue:    { fontSize: 28, fontWeight: "800", color: "#111827", textAlign: "center" },
  estimatedUsd:    { fontSize: 13, color: "#9ca3af", textAlign: "center", marginTop: 4 },

  rateBadge:       { alignSelf: "center", marginTop: 10, marginBottom: 20, backgroundColor: "#EEF3FF", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  rateBadgeText:   { fontSize: 13, fontWeight: "600", color: BLUE },

  detailsCard:     { backgroundColor: "#f8f9fb", borderRadius: 14, padding: 14, marginBottom: 16, gap: 12 },
  detailRow:       { flexDirection: "row", justifyContent: "space-between" },
  detailLabel:     { fontSize: 13, color: "#6b7280" },
  detailValue:     { fontSize: 13, fontWeight: "600", color: "#111827" },
  detailValueHighlight: { color: "#16a34a" },

  secureNote:      { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: "#EEF3FF", borderRadius: 12, padding: 14, marginBottom: 20 },
  secureTitle:     { fontSize: 13, fontWeight: "700", color: BRAND },
  secureSub:       { fontSize: 12, color: "#6b7280", marginTop: 2 },

  confirmBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  confirmBtnText:  { fontSize: 16, fontWeight: "700", color: "#fff" },
});

export default ConvertCryptoConfirmSheet;
