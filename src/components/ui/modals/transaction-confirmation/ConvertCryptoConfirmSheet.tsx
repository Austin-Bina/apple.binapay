import React, { forwardRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

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
    mode, fromSymbol, toSymbol, toIconUrl,
    Rate, youSpend, youReceive, estimatedUsd,
    onConfirm, onCancel,
  }, ref) => {
    const isBuy       = mode === "buy";
    const accentColor = isBuy ? "#16A34A" : "#7C3AED";
    const accentBg    = isBuy ? "#F0FDF4"  : "#F5F3FF";

    return (
      <BottomSheetModal
        ref={ref}
        headerTitle="Review Order"
        initialSnapPoints={["95%"]}
        index={0}
        onDismiss={onCancel}
        enableDynamicSizing={false}>

        <View style={s.container}>

          {/* Mode badge */}
          <View style={[s.modeBadge, { backgroundColor: accentBg }]}>
            <Text style={[s.modeBadgeText, { color: accentColor }]}>
              {isBuy ? "Buy" : "Sell"}
            </Text>
            <View style={s.modeBadgeRight}>
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

          {/* You Spend */}
          <Text style={s.amountLabel}>You Spend</Text>
          <Text style={s.amountValue}>{youSpend}</Text>

          {/* Arrow */}
          <View style={s.arrowWrap}>
            <View style={s.arrowCircle}>
              <MaterialCommunityIcons name="arrow-down" size={18} color={SUBLABEL} />
            </View>
          </View>

          {/* You Receive */}
          <Text style={s.receiveValue}>{youReceive}</Text>
          {estimatedUsd && (
            <Text style={s.estimatedUsd}>≈ {estimatedUsd}</Text>
          )}

          {/* Rate badge */}
          {!!Rate && (
            <View style={s.rateBadge}>
              <Text style={s.rateBadgeText}>Rate: {Rate}</Text>
            </View>
          )}

          {/* Details card */}
          <View style={s.detailsCard}>
            <DetailRow label="Payment Method" value="BinaPay Wallet" />
            <View style={s.hairline} />
            <DetailRow label="Network Fee"   value="Free" highlight />
            <View style={s.hairline} />
            <DetailRow label="You Spend"     value={youSpend} />
            <View style={s.hairline} />
            <DetailRow label="You Receive"   value={youReceive} />
          </View>

          {/* Secure note */}
          <View style={s.secureNote}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={BLUE} />
            <View style={{ flex: 1 }}>
              <Text style={s.secureTitle}>Secure &amp; Instant</Text>
              <Text style={s.secureSub}>
                Your crypto will be available instantly after confirmation.
              </Text>
            </View>
          </View>

          {/* Confirm button */}
          <TouchableOpacity
            style={[s.confirmBtn, { backgroundColor: isBuy ? BLUE : "#7C3AED" }]}
            onPress={onConfirm}
            activeOpacity={0.85}>
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

function DetailRow({
  label, value, highlight,
}: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, highlight && { color: "#16A34A" }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:             { paddingHorizontal: 20, paddingBottom: 24 },
  modeBadge:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 },
  modeBadgeText:         { fontSize: 16, fontWeight: "700" },
  modeBadgeRight:        { flexDirection: "row", alignItems: "center", gap: 6 },
  modeBadgeAsset:        { fontSize: 15, fontWeight: "700", color: BRAND },
  assetIcon:             { width: 28, height: 28, borderRadius: 14 },
  assetIconFallback:     { backgroundColor: SEPARATOR, justifyContent: "center", alignItems: "center" },
  assetIconFallbackText: { fontSize: 10, fontWeight: "700", color: SUBLABEL },
  amountLabel:           { fontSize: 12, color: SUBLABEL, textAlign: "center", marginBottom: 4 },
  amountValue:           { fontSize: 28, fontWeight: "800", color: BRAND, textAlign: "center", letterSpacing: -0.5 },
  arrowWrap:             { alignItems: "center", marginVertical: 10 },
  arrowCircle:           { width: 34, height: 34, borderRadius: 17, backgroundColor: BG, justifyContent: "center", alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  receiveValue:          { fontSize: 28, fontWeight: "800", color: LABEL, textAlign: "center", letterSpacing: -0.5 },
  estimatedUsd:          { fontSize: 13, color: SUBLABEL, textAlign: "center", marginTop: 4 },
  rateBadge:             { alignSelf: "center", marginTop: 12, marginBottom: 20, backgroundColor: BLUE_LIGHT, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  rateBadgeText:         { fontSize: 13, fontWeight: "600", color: BLUE },
  detailsCard:           { backgroundColor: BG, borderRadius: 14, overflow: "hidden", marginBottom: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  hairline:              { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR },
  detailRow:             { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 13 },
  detailLabel:           { fontSize: 13, color: SUBLABEL },
  detailValue:           { fontSize: 13, fontWeight: "600", color: LABEL },
  secureNote:            { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: BLUE_LIGHT, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  secureTitle:           { fontSize: 13, fontWeight: "700", color: BRAND },
  secureSub:             { fontSize: 12, color: SUBLABEL, marginTop: 2 },
  confirmBtn:            { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  confirmBtnText:        { fontSize: 16, fontWeight: "700", color: "#fff" },
});

export default ConvertCryptoConfirmSheet;
