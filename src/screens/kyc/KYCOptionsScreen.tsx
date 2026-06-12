import React from "react";
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Badge, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BankOutline, CardOutline } from "@components/icons/svg";
import { ActionWithDescription } from "@components/screens/account";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { Colors } from "@constants/theme/colors";
import { KYCStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { selectIsBvnVerified, selectIsNinVerified } from "@store/selectors/auth";

type Props = KYCStackScreenProps<typeof SCREENS.ACCOUNT_VERIFICATION_OPTIONS>;

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const SUBLABEL   = "#6B7280";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

export default function KYCOptionsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // ── All original logic — untouched ────────────────────────────────────────
  const isBvnVerified = useTypedSelector(selectIsBvnVerified);
  const isNinVerified = useTypedSelector(selectIsNinVerified) || isBvnVerified;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── iOS nav bar ── */}
      <View style={s.navBar}>
        <View style={s.navCenter}>
          <Text style={s.navTitle}>Account Verification</Text>
          <Text style={s.navSub}>Choose a verification method</Text>
        </View>
      </View>

      <ScrollableView contentContainerStyle={s.scroll}>

        {/* Page heading */}
        <Text style={s.pageTitle}>Verify Your Account</Text>
        <Text style={s.pageDesc}>
          Select your preferred method to verify your account. This ensures the accuracy of your details for secure transactions.
        </Text>

        {/* Verification options */}
        <View style={[s.optionsCard, IOS_SHADOW]}>
          <ActionWithDescription
            title="BVN Verification"
            description="Ensure your BVN information matches the provided account details."
            ItemIcon={BankOutline}
            onPress={() => navigation.navigate(SCREENS.BVN_VERIFICATION)}
            isDisabled={isBvnVerified}
            badgeElement={
              <Badge theme={{ colors: { error: isBvnVerified ? Colors.secondary[600] : Colors.primary[600], onError: "white" } }}>
                {isBvnVerified ? "Completed" : "Not Completed"}
              </Badge>
            }
          />
          <View style={s.hairline} />
          <ActionWithDescription
            title="NIN Verification"
            description="Ensure your NIN information matches the provided account details."
            ItemIcon={CardOutline}
            onPress={() => navigation.navigate(SCREENS.NIN_VERIFICATION)}
            isDisabled={isNinVerified}
            badgeElement={
              <Badge theme={{ colors: { error: isNinVerified ? Colors.secondary[600] : Colors.primary[600], onError: "white" } }}>
                {isNinVerified ? "Completed" : "Not Completed"}
              </Badge>
            }
          />
        </View>

        {/* Why card */}
        <View style={[s.whyCard, IOS_SHADOW]}>
          <View style={s.whyIconWrap}>
            <MaterialCommunityIcons name="information-outline" size={20} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.whyTitle}>Why do we need this?</Text>
            <Text style={s.whyBody}>
              All services are provided in accordance with the Central Bank of Nigeria's circular on virtual accounts.
            </Text>
          </View>
        </View>

      </ScrollableView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  navBar:      { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR, alignItems: "center" },
  navCenter:   { alignItems: "center" },
  navTitle:    { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:      { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  scroll:      { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  pageTitle:   { fontSize: 22, fontWeight: "800", color: BRAND, letterSpacing: -0.4, marginBottom: 8 },
  pageDesc:    { fontSize: 14, color: SUBLABEL, lineHeight: 20, marginBottom: 20 },
  optionsCard: { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 16 },
  hairline:    { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR },
  whyCard:     { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  whyIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: SURFACE, justifyContent: "center", alignItems: "center" },
  whyTitle:    { fontSize: 14, fontWeight: "700", color: BRAND, marginBottom: 4 },
  whyBody:     { fontSize: 13, color: SUBLABEL, lineHeight: 19 },
});
