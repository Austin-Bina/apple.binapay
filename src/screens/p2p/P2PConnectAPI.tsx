import React, { useState } from "react";
import { View, StyleSheet, TextInput, ActivityIndicator, ScrollView, TouchableOpacity, Platform, StatusBar, KeyboardAvoidingView } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { showToast } from "@helpers/toast";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { useConnectP2PMutation } from "@store/redux-api/p2p";

type Props = P2PStackScreenProps<"P2P Connect API">;

const BRAND      = "#2563EB";
const BRAND_DARK = "#1E3A8A";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

export default function P2PConnectAPIScreen({ navigation, route }: Props) {
  const insets   = useSafeAreaInsets();
  const exchange = (route.params as any)?.exchange ?? "bybit";

  // ── All original state + handlers — untouched ────────────────────────────
  const [apiKey, setApiKey]         = useState("");
  const [apiSecret, setApiSecret]   = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [connectP2P, { isLoading }] = useConnectP2PMutation();

  const exchangeLabel = exchange === "bybit" ? "Bybit" : exchange;
  const isValid = apiKey.trim().length > 10 && apiSecret.trim().length > 10;

  const handleConnect = async () => {
    if (!isValid) { showToast({ message: "Please enter a valid API key and secret", duration: 2000 }); return; }
    try {
      await connectP2P({ exchange, api_key: apiKey.trim(), api_secret: apiSecret.trim() }).unwrap();
      showToast({ message: `${exchangeLabel} connected successfully!`, duration: 2000 });
      navigation.navigate(SCREENS.P2P_CONNECT_SUCCESS, { exchange });
    } catch (err: any) {
      showToast({ message: err?.data?.message ?? "Connection failed. Please check your keys and try again.", duration: 3000 });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.root, { paddingBottom: insets.bottom + 16 }]}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Step badge */}
          <View style={s.stepBadge}>
            <Text style={s.stepText}>Step 2 of 2</Text>
          </View>

          <Text style={s.heading}>Connect {exchangeLabel}</Text>
          <Text style={s.subheading}>Enter your API key and secret to link your P2P account</Text>

          {/* API Key */}
          <Text style={s.fieldLabel}>API Key</Text>
          <View style={[s.inputCard, apiKey.length > 0 && s.inputCardActive]}>
            <MaterialCommunityIcons name="key-outline" size={18} color={apiKey.length > 0 ? BRAND : PLACEHOLDER} />
            <TextInput
              style={s.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Paste your API key here"
              placeholderTextColor={PLACEHOLDER}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {apiKey.length > 0 && (
              <MaterialCommunityIcons name="check-circle" size={16} color={BRAND} />
            )}
          </View>

          {/* API Secret */}
          <Text style={s.fieldLabel}>API Secret</Text>
          <View style={[s.inputCard, apiSecret.length > 0 && s.inputCardActive]}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={apiSecret.length > 0 ? BRAND : PLACEHOLDER} />
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={apiSecret}
              onChangeText={setApiSecret}
              placeholder="Paste your API secret here"
              placeholderTextColor={PLACEHOLDER}
              secureTextEntry={!showSecret}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowSecret(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showSecret ? "eye-off-outline" : "eye-outline"} size={20} color={SUBLABEL} />
            </TouchableOpacity>
          </View>

          {/* Permissions reminder */}
          <View style={s.reminderCard}>
            <View style={s.reminderHeader}>
              <MaterialCommunityIcons name="information-outline" size={16} color={BRAND} />
              <Text style={s.reminderTitle}>Required API permissions</Text>
            </View>
            <View style={s.reminderRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={15} color="#16A34A" />
              <Text style={s.reminderItem}>Read (account &amp; order info)</Text>
            </View>
            <View style={s.reminderRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={15} color="#16A34A" />
              <Text style={s.reminderItem}>Trade (P2P orders only)</Text>
            </View>
            <View style={s.reminderRow}>
              <MaterialCommunityIcons name="close-circle-outline" size={15} color="#DC2626" />
              <Text style={[s.reminderItem, { color: "#DC2626" }]}>Do NOT enable Withdraw permission</Text>
            </View>
          </View>
        </ScrollView>

        {/* CTA */}
        <TouchableOpacity
          style={[s.ctaBtn, !isValid && s.ctaBtnDisabled]}
          onPress={handleConnect}
          disabled={isLoading || !isValid}
          activeOpacity={0.85}>
          {isLoading ? (
            <ActivityIndicator color={SURFACE} />
          ) : (
            <>
              <MaterialCommunityIcons name="link-variant" size={20} color={SURFACE} />
              <Text style={s.ctaText}>Connect {exchangeLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: SURFACE },
  scroll:        { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  stepBadge:     { alignSelf: "center", backgroundColor: BLUE_LIGHT, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 16 },
  stepText:      { fontSize: 13, fontWeight: "600", color: BRAND },
  heading:       { fontSize: 24, fontWeight: "800", color: BRAND_DARK, textAlign: "center", marginBottom: 8, letterSpacing: -0.4 },
  subheading:    { fontSize: 14, color: SUBLABEL, textAlign: "center", lineHeight: 21, marginBottom: 28 },
  fieldLabel:    { fontSize: 13, fontWeight: "600", color: SUBLABEL, marginBottom: 8 },
  inputCard:     { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: BG, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 20, borderWidth: 1.5, borderColor: "transparent" },
  inputCardActive: { backgroundColor: BLUE_LIGHT, borderColor: BRAND },
  input:         { flex: 1, fontSize: 14, color: LABEL },
  reminderCard:  { backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 16, gap: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  reminderHeader:{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  reminderTitle: { fontSize: 13, fontWeight: "700", color: LABEL },
  reminderRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  reminderItem:  { fontSize: 13, color: SUBLABEL },
  ctaBtn:        { marginHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BRAND, borderRadius: 14, paddingVertical: 16 },
  ctaBtnDisabled:{ opacity: 0.4 },
  ctaText:       { fontSize: 16, fontWeight: "700", color: SURFACE },
});
