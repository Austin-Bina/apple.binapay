// CryptoAssetsScreen.tsx
import React from "react";
import { View, FlatList, Text, Image, StyleSheet } from "react-native";
import { CryptoProvider, useCrypto } from "./CryptoContext";
import { formattedBalance } from "@utils/transactionutils";

const CryptoAssetsList: React.FC = () => {
  const { assets, loading } = useCrypto();

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading crypto assets...</Text>
      </View>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No crypto assets available.</Text>
      </View>
    );
  }

  return (
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
           <Text style={styles.assetPrice}>
 $ {item.price_usd ? formattedBalance(item.price_usd, "USD", 2) : "--"}
</Text>
            </View>
          </View>

          {/* Right Section */}
          <View style={styles.right}>
            <Text style={styles.assetBalance}>
  {formattedBalance(item.balance ?? 0, item.symbol, item.decimal_places ?? 8)}
</Text>

            <Text style={styles.assetValue}>
  ${formattedBalance((item.balance ?? 0) * (item.price_usd ?? 0), "", 2)}
</Text>
          </View>
        </View>
      )}
    />
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
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eee",
  },
  assetName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  assetPrice: {
    fontSize: 12,
    color: "#666",
  },
  right: {
    alignItems: "flex-end",
  },
  assetBalance: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  assetValue: {
    fontSize: 12,
    color: "#666",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
