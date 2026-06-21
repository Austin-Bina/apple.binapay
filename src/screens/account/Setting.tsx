import tw from "@lib/tailwind";
import React, { useState, useEffect } from "react";
import { Linking, View, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
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

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

function MenuRow({
  icon,
  title,
  subtitle,
  badge,
  onPress,
  danger,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
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
        <MaterialCommunityIcons name="chevron-right" size={18} color={danger ? "#DC2626" : "#9ca3af"} />
      </TouchableOpacity>
      {!last && <View style={s.rowDivider} />}
    </>
  );
}

export default function SettingScreen({ navigation }: Props) {
  const user          = useTypedSelector(selectUser);
  const isLoggingIn   = useTypedSelector(selectIsLoggingIn);
  const dispatch      = useTypedDispatch();
  const isBvnVerified = useTypedSelector(selectIsBvnVerified);
  const isNinVerified = useTypedSelector(selectIsNinVerified);
  const { checkForUpdates, isCheckingForUpdates, currentVersion, buildNumber } = useAppVersion();
  const [wasChecking, setWasChecking] = useState(false);
  const insets = useSafeAreaInsets();


  const isVerified = (isBvnVerified || isNinVerified) && 
                   !!user?.phone_verified_at && 
                   !!user?.email_verified_at;
  const formattedVersion = `${currentVersion}${buildNumber ? ` (${buildNumber})` : ""}`;

  const handleLogout = () => dispatch(authSliceActions.doLogout());

  const handleCheckForUpdates = () => {
    checkForUpdates();
    showToast({ message: "Checking for updates...", duration: 2000 });
  };

  useEffect(() => {
    if (isCheckingForUpdates) {
      setWasChecking(true);
    } else if (wasChecking) {
      showToast({ message: "You're using the latest version", duration: 2000 });
      setWasChecking(false);
    }
  }, [isCheckingForUpdates, wasChecking]);

  return (
    <SafeAreaView style={s.root}>
      

      <ScrollableView>
        {/* ── Profile row ── */}
        <TouchableOpacity
          style={s.profileCard}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.7}
        >
          <AvatarImage
            avatar={user?.avatar}
            size={scale(48)}
            svgProps={{ width: scale(48), height: scale(48) }}
          />
          <View style={s.profileText}>
            <Text style={s.profileName}>{user?.name}</Text>
            <Text style={s.profileSub}>Personal Information</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        {/* ── Verification card ── */}
        <TouchableOpacity
          style={s.verificationCard}
          onPress={() => navigation.navigate(SCREENS.VERIFY_ACCOUNT, { screen: SCREENS.VERIFICATION_HUB })}
          activeOpacity={0.7}
        >
          <View style={[s.menuIconWrap, { backgroundColor: isVerified ? "#EEF3FF" : "#FEF3C7" }]}>
            <MaterialCommunityIcons
              name={isVerified ? "shield-check" : "shield-alert"}
              size={18}
              color={isVerified ? BLUE : "#D97706"}
            />
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
          <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
        </TouchableOpacity>

        {/* ── All menu items in one card ── */}
        <View style={s.section}>
          <MenuRow
            icon={<MaterialCommunityIcons name="lock-outline" size={18} color={BLUE} />}
            title="Change Password"
            onPress={() => navigation.navigate("Change Password")}
          />
          <MenuRow
            icon={<MaterialCommunityIcons name="dialpad" size={18} color={BLUE} />}
            title="Change Pin"
            onPress={() => navigation.navigate(SCREENS.CHANGE_PIN)}
          />
          <MenuRow
            icon={<MaterialCommunityIcons name="trophy-outline" size={18} color={BLUE} />}
            title="P2P Manager"
            onPress={() => navigation.navigate(SCREENS.P2P_MANAGER_STACK, { screen: SCREENS.P2P_MANAGER })}
          />
          <MenuRow
            icon={<MaterialCommunityIcons name="gift-outline" size={18} color={BLUE} />}
            title="BinaPay Rewards"
            onPress={() => navigation.navigate("BinaPay Rewards")}
          />
          <MenuRow
           icon={<MaterialCommunityIcons name="file-document-outline" size={18} color={BLUE} />}
           title="Account Statement"
          // subtitle="Download your transaction history"
           onPress={() => navigation.navigate(SCREENS.STATEMENT)}  // add SCREENS.STATEMENT
          />
          <MenuRow
            icon={<MaterialCommunityIcons name="bank-transfer" size={18} color={BLUE} />}
            title="Auto Crypto Payout"
            onPress={() => navigation.navigate(SCREENS.AUTO_CRYPTO_SETTLEMENT)}
          />
          <MenuRow
            icon={<MaterialCommunityIcons name="bank-outline" size={18} color={BLUE} />}
            title="Manage Bank Accounts"
            onPress={() => navigation.navigate("Bank Accounts")}
          />
          <MenuRow
            icon={<MaterialCommunityIcons name="headset" size={18} color={BLUE} />}
            title="Help & Support"
            onPress={() => navigation.navigate(SCREENS.SUPPORT_STACK, { screen: SCREENS.DEPARTMENT_AND_HISTORY_TAB })}
          />
          <MenuRow
            icon={<MaterialCommunityIcons name="shield-lock-outline" size={18} color={BLUE} />}
            title="Privacy Policy"
            onPress={() => Linking.openURL(routes.web.v1.public.privacy)}
          />
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
        <View style={[s.section, { marginTop: 8 }]}>
          <MenuRow
            icon={<MaterialCommunityIcons name="logout" size={18} color="#DC2626" />}
            title="Log Out"
            onPress={handleLogout}
            danger
            last
          />
        </View>

        {/* ── Version footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>BinaPay v{formattedVersion}</Text>
        </View>
      </ScrollableView>

      <PleaseWaitModal visible={isLoggingIn} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#f8f9fb" },
  header: { paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  headerTitle:      { fontSize: 22, fontWeight: "800", color: "#111827" },

  profileCard:      { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f0f0f0" },
  profileText:      { flex: 1 },
  profileName:      { fontSize: 15, fontWeight: "700", color: "#111827" },
  profileSub:       { fontSize: 12, color: "#6b7280", marginTop: 1 },

  verificationCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f0f0f0" },
  verifiedBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 4 },
  verifiedBadgeText:{ fontSize: 11, fontWeight: "600" },

  section:          { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },
  rowDivider:       { height: 1, backgroundColor: "#f3f4f6", marginLeft: 56 },

  menuRow:          { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  menuIconWrap:     { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  menuRowText:      { flex: 1 },
  menuRowTitle:     { fontSize: 14, fontWeight: "500", color: "#111827" },
  menuRowSub:       { fontSize: 11, color: "#6b7280", marginTop: 1 },

  versionBadge:     { flexDirection: "row", alignItems: "center", backgroundColor: "#EEF3FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  versionBadgeText: { fontSize: 11, fontWeight: "600", color: BLUE },

  footer:           { alignItems: "center", paddingVertical: 24 },
  footerText:       { fontSize: 12, color: "#9ca3af" },
});
