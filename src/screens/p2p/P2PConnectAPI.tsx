import React, { useState } from "react";
import { View, StyleSheet, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { showToast } from "@helpers/toast";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { useConnectP2PMutation } from "@store/redux-api/p2p";

type Props = P2PStackScreenProps<"P2P Connect API">;

const BRAND = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";

export default function P2PConnectAPIScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const exchange = (route.params as any)?.exchange ?? "bybit";

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [connectP2P, { isLoading }] = useConnectP2PMutation();

const exchangeLabel = exchange === "bybit" ? "Bybit" : exchange;
const isValid = apiKey.trim().length > 10 && apiSecret.trim().length > 10;

const handleConnect = async () => {
  if (!isValid) {
    showToast({ message: "Please enter a valid API key and secret", duration: 2000 });
    return;
  }
  try {
    await connectP2P({
      exchange,
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
    }).unwrap();

    showToast({ message: `${exchangeLabel} connected successfully!`, duration: 2000 });
    navigation.navigate(SCREENS.P2P_CONNECT_SUCCESS, { exchange });

  } catch (err: any) {
    const message =
      err?.data?.message ?? "Connection failed. Please check your keys and try again.";
    showToast({ message, duration: 3000 });
  }
};

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Step badge */}
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step 2 of 2</Text>
        </View>

        <Text style={styles.heading}>Connect {exchangeLabel} API</Text>
        <Text style={styles.subheading}>
          Enter your {exchangeLabel} API key and secret to link your P2P account to BinaPay
        </Text>

        {/* API Key */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>API Key</Text>
          <View style={[styles.inputBox, apiKey.length > 0 && styles.inputBoxActive]}>
            <MaterialCommunityIcons name="key-outline" size={18} color={apiKey.length > 0 ? BRAND : "#BBB"} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Paste your API key here"
              placeholderTextColor="#BBB"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* API Secret */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>API Secret</Text>
          <View style={[styles.inputBox, apiSecret.length > 0 && styles.inputBoxActive]}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={apiSecret.length > 0 ? BRAND : "#BBB"} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={apiSecret}
              onChangeText={setApiSecret}
              placeholder="Paste your API secret here"
              placeholderTextColor="#BBB"
              secureTextEntry={!showSecret}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableRipple
              onPress={() => setShowSecret((v) => !v)}
              style={styles.eyeBtn}
              borderless>
              {showSecret
                ? <Ionicons name="eye-off-outline" size={20} color="#999" />
                : <Ionicons name="eye-outline" size={20} color="#999" />}
            </TouchableRipple>
          </View>
        </View>

        {/* Permission reminder */}
        <View style={styles.reminderBox}>
          <View style={styles.reminderHeader}>
            <MaterialCommunityIcons name="information-outline" size={16} color={BRAND} />
            <Text style={styles.reminderTitle}>Required API permissions</Text>
          </View>
          <View style={styles.reminderRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={15} color="#2E7D32" />
            <Text style={styles.reminderItem}>Read (account & order info)</Text>
          </View>
          <View style={styles.reminderRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={15} color="#2E7D32" />
            <Text style={styles.reminderItem}>Trade (P2P orders only)</Text>
          </View>
          <View style={styles.reminderRow}>
            <MaterialCommunityIcons name="close-circle-outline" size={15} color="#E53935" />
            <Text style={[styles.reminderItem, styles.reminderDanger]}>
              Do NOT enable Withdraw permission
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* CTA */}
      <TouchableRipple
        style={[styles.ctaBtn, !isValid && styles.ctaBtnDisabled]}
        onPress={handleConnect}
        disabled={isLoading || !isValid}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.ctaInner}>
            <MaterialCommunityIcons name="link-variant" size={20} color="#fff" />
            <Text style={styles.ctaText}>Connect {exchangeLabel}</Text>
          </View>
        )}
      </TouchableRipple>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },

  stepBadge: {
    alignSelf: "center",
    backgroundColor: BRAND_LIGHT,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  stepText: { fontSize: 13, fontWeight: "600", color: BRAND },

  heading: { fontSize: 22, fontWeight: "800", color: "#111", textAlign: "center", marginBottom: 8 },
  subheading: { fontSize: 14, color: "#777", textAlign: "center", lineHeight: 21, marginBottom: 28 },

  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 8 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FAFAFA",
  },
  inputBoxActive: {
    borderColor: BRAND,
    backgroundColor: "#FAFCFF",
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111",
    paddingVertical: 14,
  },
  eyeBtn: { padding: 6 },

  reminderBox: {
    backgroundColor: BRAND_LIGHT,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D0D9EE",
    gap: 8,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  reminderTitle: { fontSize: 13, fontWeight: "700", color: "#333" },
  reminderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reminderItem: { fontSize: 13, color: "#555" },
  reminderDanger: { color: "#E53935" },

  ctaBtn: {
    marginHorizontal: 20,
    backgroundColor: BRAND,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaBtnDisabled: { opacity: 0.4 },
  ctaInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
