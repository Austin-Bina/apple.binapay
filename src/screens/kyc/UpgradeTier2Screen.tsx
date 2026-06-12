import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

type Props = KYCStackScreenProps<typeof SCREENS.UPGRADE_TIER2>;

export default function UpgradeTier2Screen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const requirements = [
    {
      icon: "face-recognition",
      title: "Face Verification",
      sub: "Verify your face to confirm you are the real owner of this account.",
      screen: SCREENS.FACE_VERIFICATION,
    },
    {
      icon: "home-city-outline",
      title: "Address Verification",
      sub: "Verify your residential address.",
      screen: SCREENS.ADDRESS_VERIFICATION,
    },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── iOS nav bar ── */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={s.navCenter}>
          <Text style={s.navTitle}>Upgrade to Tier 2</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.body}>
        {/* Hero banner */}
        <View style={[s.banner, IOS_SHADOW]}>
          <View style={s.bannerIconWrap}>
            <MaterialCommunityIcons name="shield-crown-outline" size={40} color={BLUE} />
          </View>
          <Text style={s.bannerTitle}>Unlock Higher Limits</Text>
          <Text style={s.bannerSub}>
            Complete Tier 2 verification to enjoy higher transaction and crypto limits.
          </Text>
        </View>

        {/* Requirements */}
        <Text style={s.sectionLabel}>Tier 2 Requirements</Text>
        <View style={[s.reqCard, IOS_SHADOW]}>
          {requirements.map((req, i) => (
            <React.Fragment key={req.title}>
              {i > 0 && <View style={s.hairline} />}
              <TouchableOpacity
                style={s.reqRow}
                onPress={() => navigation.navigate(req.screen as any)}
                activeOpacity={0.8}>
                <View style={s.reqIconWrap}>
                  <MaterialCommunityIcons name={req.icon as any} size={22} color={BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.reqTitle}>{req.title}</Text>
                  <Text style={s.reqSub}>{req.sub}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={PLACEHOLDER} />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity
          style={s.startBtn}
          onPress={() => navigation.navigate(SCREENS.FACE_VERIFICATION as any)}
          activeOpacity={0.85}>
          <Text style={s.startBtnText}>Start Tier 2 Verification</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  navBar:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:     { flex: 1, alignItems: "center" },
  navTitle:      { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  body:          { flex: 1, padding: 20 },
  banner:        { backgroundColor: BLUE_LIGHT, borderRadius: 18, padding: 24, alignItems: "center", marginBottom: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  bannerIconWrap:{ width: 72, height: 72, borderRadius: 36, backgroundColor: SURFACE, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  bannerTitle:   { fontSize: 18, fontWeight: "800", color: BRAND, marginBottom: 6, letterSpacing: -0.3 },
  bannerSub:     { fontSize: 13, color: SUBLABEL, textAlign: "center", lineHeight: 19 },
  sectionLabel:  { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10, marginLeft: 4 },
  reqCard:       { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 20 },
  hairline:      { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 62 },
  reqRow:        { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 15, minHeight: 66 },
  reqIconWrap:   { width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  reqTitle:      { fontSize: 14, fontWeight: "600", color: LABEL, marginBottom: 3 },
  reqSub:        { fontSize: 12, color: SUBLABEL, lineHeight: 17 },
  startBtn:      { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  startBtnText:  { fontSize: 16, fontWeight: "700", color: SURFACE },
});
