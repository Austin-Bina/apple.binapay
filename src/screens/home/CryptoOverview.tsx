
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useCrypto } from "./CryptoContext";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { StackParamList, TabParamList } from "@navigators/types";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs/lib/typescript/src/types";
import { SCREENS } from "@constants/screens";
import { formattedBalance } from "../../utils/transactionutils";
import { useSelector } from "react-redux";
import { selectNgnUsdtRateWithSpread } from "@store/selectors/auth";
import React, { useState } from "react";

// ✅ Main Component
export default function CryptoOverview() {
  const { assets } = useCrypto();
  const ngnRate = useSelector(selectNgnUsdtRateWithSpread); 
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");
  const navigation = useNavigation<
    CompositeNavigationProp<
      NativeStackNavigationProp<StackParamList, typeof SCREENS.MAIN>,
      BottomTabNavigationProp<TabParamList>
    >
  >();
// tools-tip: Add currency toggle button
  <View style={{ flexDirection: "row", marginBottom: 12, justifyContent: "flex-end" }}>
  <TouchableOpacity onPress={() => setCurrency("NGN")}>
    <Text style={{ color: currency === "NGN" ? "#007bff" : "#666", fontWeight: currency === "NGN" ? "600" : "400" }}>
      NGN
    </Text>
  </TouchableOpacity>
  <Text style={{ marginHorizontal: 8, color: "#666" }}>|</Text>
  <TouchableOpacity onPress={() => setCurrency("USD")}>
    <Text style={{ color: currency === "USD" ? "#007bff" : "#666", fontWeight: currency === "USD" ? "600" : "400" }}>
      USD
    </Text>
  </TouchableOpacity>
</View>



  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      {/* Left */}
      <View style={styles.left}>
        <Image
          source={item.icon_url ? { uri: item.icon_url } : require("@assets/images/oops.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.assetName}>{item.name}</Text>
          
          <Text style={styles.assetPrice}>
  ₦
  {item.price_usd && ngnRate?.sell
    ? formattedBalance(item.price_usd * ngnRate.sell, "", 2)
    : "--"}
</Text>

        </View>
      </View>

      {/* Right */}
      <View style={styles.right}>
        <Text style={styles.assetBalance}>
  {formattedBalance(item.balance, item.symbol, item.decimal_places ?? 8)}
</Text>
 <Text style={styles.assetValue}>
        ₦
        {item.balance && item.price_usd && ngnRate?.sell
          ? formattedBalance(item.balance * item.price_usd * ngnRate.sell, "", 2)
          : "0.00"}
      </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with View All */}
      <View style={styles.header}>
        {assets.length > 5 && (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate(SCREENS.MAIN, {
                screen: "Home",
                params: { screen: SCREENS.CRYPTO_ASSETS },
              });
            }}
          >
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={assets.slice(0, 5)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  link: {
    color: "#007bff",
    fontSize: 14,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 8,
    alignItems: "center",
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
});
