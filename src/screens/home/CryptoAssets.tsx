// CryptoAssetsScreen.tsx
import React, { useState } from "react";
import { View, FlatList, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { CryptoProvider, useCrypto } from "./CryptoContext";
import { formattedBalance } from "@utils/transactionutils";
import { useSelector } from "react-redux";
import { selectNgnUsdtRateWithSpread } from "@store/selectors/auth";

const CryptoAssetsList: React.FC = () => {
  const { assets } = useCrypto();
  const ngnRate = useSelector(selectNgnUsdtRateWithSpread); 
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");

  if (!assets || assets.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No crypto assets available.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Currency Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity onPress={() => setCurrency("NGN")}>
          <Text style={[styles.toggleText, currency === "NGN" && styles.activeToggle]}>
            NGN
          </Text>
        </TouchableOpacity>
        <Text style={styles.toggleSeparator}>|</Text>
        <TouchableOpacity onPress={() => setCurrency("USD")}>
          <Text style={[styles.toggleText, currency === "USD" && styles.activeToggle]}>
            USD
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={assets}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Left Section */}
            <View style={styles.left}>
              <Image
                source={
                  item.icon_url
                    ? { uri: item.icon_url }
                    : require("@assets/images/oops.png")
                }
                style={styles.icon}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.assetName}>{item.name}</Text>

                {/* Price based on selected currency */}
                <Text style={styles.assetPrice}>
                  {currency === "NGN"
                    ? item.price_usd && ngnRate?.sell
                      ? `₦${formattedBalance(item.price_usd * ngnRate.sell, "", 2)}`
                      : "--"
                    : item.price_usd
                      ? `$${formattedBalance(item.price_usd, "", 2)}`
                      : "--"}
                </Text>
              </View>
            </View>

            {/* Right Section */}
            <View style={styles.right}>
              <Text style={styles.assetBalance}>
                {formattedBalance(item.balance ?? 0, item.symbol, item.decimal_places ?? 8)}
              </Text>

              {/* Total value based on selected currency */}
              <Text style={styles.assetValue}>
                {currency === "NGN"
                  ? item.balance && item.price_usd && ngnRate?.sell
                    ? `₦${formattedBalance(item.balance * item.price_usd * ngnRate.sell, "", 2)}`
                    : "0.00"
                  : item.balance && item.price_usd
                    ? `$${formattedBalance(item.balance * item.price_usd, "", 2)}`
                    : "0.00"}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default function CryptoAssetsScreen() {
  return (
    <CryptoProvider>
      <View style={styles.container}>
        <CryptoAssetsList />
      </View>
    </CryptoProvider>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  toggleContainer: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 12 },
  toggleText: { color: "#666", fontSize: 14 },
  activeToggle: { color: "#007bff", fontWeight: "600" },
  toggleSeparator: { marginHorizontal: 8, color: "#666" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#eee" },
  assetName: { fontSize: 14, fontWeight: "600", color: "#222" },
  assetPrice: { fontSize: 12, color: "#666" },
  right: { alignItems: "flex-end" },
  assetBalance: { fontSize: 14, fontWeight: "600", color: "#111" },
  assetValue: { fontSize: 12, color: "#666" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
