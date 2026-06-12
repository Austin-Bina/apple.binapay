import React, { useState, useEffect } from "react";
import { Linking, View, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { AccountStackScreenProps } from "@navigators/types";
import { authSliceActions } from "@store/slice/auth";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { selectIsBvnVerified, selectIsLoggingIn, selectIsNinVerified, selectUser } from "@store/selectors/auth";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { AvatarImage } from "@components/avatar";
import { scale } from "react-native-size-matters";
import { SCREENS } from "@constants/screens";
import { routes } from "@constants/routes";
import { useAppVersion } from "@providers/app-version-provider";
import { showToast } from "@helpers/toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = AccountStackScreenProps<"Settings">;

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

// ── Menu row component — iOS grouped row style ─────────────────────────────
function MenuRow({
  icon, title, subtitle, badge, onPress, danger, last,
}: {
  icon: React.ReactNode; title: string; subtitle?: string;
  badge?: React.ReactNode; onPress: () => void; danger?: boolean; last?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={s.menuRow} onPress={onPress} activeOpacity={0.7}>
        <View style={[s.menuIconWrap, danger && { backgroundColor: "#FEF2F2" }]}>
          {icon}
        </View>
        <View style={s.menuRowText}>
          <Text style={[s.menuRowTitle, danger && { color: "#DC2626" }]}>{title}</Text>
          {subtitle ? <Text style={s.menuRowSub}>{subtitle}</Text> : null}
        </View>
        {badge ? <View style={{ marginRight: 4 }}>{badge}</View> : null}
        <MaterialCommunityIcons name="chevron-right" size={18} color={danger ? "#DC2626" : PLACEHOLDER} />
      </TouchableOpacity>
      {!last && <View style={s.rowDivider} />}
    </>
  );
}

export default function SettingScreen({ navigation }: Props) {
  // ── All original logic — untouched ────────────────────────────────────────
  const user        = useTypedSelector(selectUser);
  const isLoggingIn = useTypedSelector(selectIsLoggingIn);
  const dispatch    = useTypedDispatch();
  const isBvnVerified = useTypedSelector(selectIsBvnVerified);
  const isNinVerified = useTypedSelector(selectIsNinVerified);
  const { checkForUpdates, isCheckingForUpdates, currentVersion, buildNumber } = useAppVersion();
  const [wasChecking, setWasChecking] = useState(false);
  const insets = useSafeAreaInsets();

  const isVerified = (isBvnVerified || isNinVerified) && !!user?.phone_verified_at && !!user?.email_verified_at;
  const formattedVersion = `${currentVersion}${buildNumber ? ` (${buildNumber})` : ""}`;

  const handleLogout = () => dispatch(authSliceActions.doLogout());

  const handleCheckForUpdates = () => {
    checkForUpdates();
    showToast({ message: "Checking for updates…", duration: 2000 });
  };

  useEffect(() => {
    if (isCheckingForUpdates) { setWasChecking(true); }
    else if (wasChecking) { showToast({ message: "You're using the latest version", duration: 2000 }); setWasChecking(false); }
  }, [isCheckingForUpdates, wasChecking]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header — large title style (no back btn, this is a tab root) ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Menu</Text>
      </View>

      <ScrollableView contentContainerStyle={s.scroll}>

        {/* ── Profile card ── */}
        <TouchableOpacity style={[s.profileCard, IOS_SHADOW]} onPress={() => navigation.navigate("Profile")} activeOpacity={0.7}>
          <AvatarImage avatar={user?.avatar} size={scale(48)} svgProps={{ width: scale(48), height: scale(48) }} />
          <View style={s.profileText}>
            <Text style={s.profileName}>{user?.name}</Text>
            <Text style={s.profileSub}>Personal Information</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={PLACEHOLDER} />
        </TouchableOpacity>

        {/* ── Verification card ── */}
        <TouchableOpacity
          style={[s.verificationCard, IOS_SHADOW]}
          onPress={() => navigation.navigate(SCREENS.VERIFY_ACCOUNT, { screen: SCREENS.VERIFICATION_HUB })}
          activeOpacity={0.7}>
          <View style={[s.menuIconWrap, { backgroundColor: isVerified ? BLUE_LIGHT : "#FEF3C7" }]}>
            <MaterialCommunityIcons name={isVerified ? "shield-check" : "shield-alert"} size={18} color={isVerified ? BLUE : "#D97706"} />
          </View>
          <View style={s.menuRowText}>
            <Text style={s.menuRowTitle}>Verification</Text>
            <Text style={s.menuRowSub}>{isVerified ? "Tier 1 verified" : "Complete your verification"}</Text>
          </View>
          <View style={[s.verifiedBadge, { backgroundColor: isVerified ? "#DCFCE7" : "#FEF3C7" }]}>
            <Text style={[s.verifiedBadgeText, { color: isVerified ? "#16A34A" : "#D97706" }]}>
              {isVerified ? "Verified" : "Pending"}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={PLACEHOLDER} />
        </TouchableOpacity>

        {/* ── Main menu ── */}
        <View style={[s.section, IOS_SHADOW]}>
          <MenuRow icon={<MaterialCommunityIcons name="lock-outline" size={18} color={BLUE} />} title="Change Password" onPress={() => navigation.navigate("Change Password")} />
          <MenuRow icon={<MaterialCommunityIcons name="dialpad" size={18} color={BLUE} />} title="Change PIN" onPress={() => navigation.navigate(SCREENS.CHANGE_PIN)} />
          <MenuRow icon={<MaterialCommunityIcons name="trophy-outline" size={18} color={BLUE} />} title="P2P Manager" onPress={() => navigation.navigate(SCREENS.P2P_MANAGER_STACK, { screen: SCREENS.P2P_MANAGER })} />
          <MenuRow icon={<MaterialCommunityIcons name="gift-outline" size={18} color={BLUE} />} title="BinaPay Rewards" onPress={() => navigation.navigate("BinaPay Rewards")} />
          <MenuRow icon={<MaterialCommunityIcons name="bank-transfer" size={18} color={BLUE} />} title="Auto Crypto Payout" onPress={() => navigation.navigate(SCREENS.AUTO_CRYPTO_SETTLEMENT)} />
          <MenuRow icon={<MaterialCommunityIcons name="bank-outline" size={18} color={BLUE} />} title="Manage Bank Accounts" onPress={() => navigation.navigate("Bank Accounts")} />
          <MenuRow icon={<MaterialCommunityIcons name="headset" size={18} color={BLUE} />} title="Help & Support" onPress={() => navigation.navigate(SCREENS.SUPPORT_STACK, { screen: SCREENS.DEPARTMENT_AND_HISTORY_TAB })} />
          <MenuRow icon={<MaterialCommunityIcons name="shield-lock-outline" size={18} color={BLUE} />} title="Privacy Policy" onPress={() => Linking.openURL(routes.web.v1.public.privacy)} />
          <MenuRow
            icon={<MaterialCommunityIcons name="cellphone-arrow-down" size={18} color={BLUE} />}
            title="Check for Updates"
            badge={
              <View style={s.versionBadge}>
                {isCheckingForUpdates && <ActivityIndicator size={12} color={BLUE} style={{ marginRight: 4 }} />}
                <Text style={s.versionBadgeText}>v{formattedVersion}</Text>
              </View>
            }
            onPress={handleCheckForUpdates}
            last
          />
        </View>

        {/* ── Logout ── */}
        <View style={[s.section, IOS_SHADOW]}>
          <MenuRow
            icon={<MaterialCommunityIcons name="logout" size={18} color="#DC2626" />}
            title="Log Out"
            onPress={handleLogout}
            danger
            last
          />
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>BinaPay v{formattedVersion}</Text>
        </View>
      </ScrollableView>

      <PleaseWaitModal visible={isLoggingIn} />
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: BG },
  header:            { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: BG },
  headerTitle:       { fontSize: 28, fontWeight: "800", color: LABEL, letterSpacing: -0.5 },
  scroll:            { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
  profileCard:       { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  profileText:       { flex: 1 },
  profileName:       { fontSize: 15, fontWeight: "700", color: LABEL },
  profileSub:        { fontSize: 12, color: SUBLABEL, marginTop: 1 },
  verificationCard:  { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  verifiedBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 4 },
  verifiedBadgeText: { fontSize: 11, fontWeight: "600" },
  section:           { backgroundColor: SURFACE, borderRadius: 16, marginBottom: 10, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  rowDivider:        { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 56 },
  menuRow:           { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14, minHeight: 54 },
  menuIconWrap:      { width: 36, height: 36, borderRadius: 10, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  menuRowText:       { flex: 1 },
  menuRowTitle:      { fontSize: 15, fontWeight: "500", color: LABEL },
  menuRowSub:        { fontSize: 12, color: SUBLABEL, marginTop: 1 },
  versionBadge:      { flexDirection: "row", alignItems: "center", backgroundColor: BLUE_LIGHT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  versionBadgeText:  { fontSize: 11, fontWeight: "600", color: BLUE },
  footer:            { alignItems: "center", paddingVertical: 24 },
  footerText:        { fontSize: 12, color: PLACEHOLDER },
});
