import React from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useCrypto } from "./CryptoContext";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { StackParamList, TabParamList } from "@navigators/types";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs/lib/typescript/src/types";
import { SCREENS } from "@constants/screens";
import { formattedBalance } from "../../utils/transactionutils";

// ✅ Main Component
export default function CryptoOverview() {
  const { assets, loading } = useCrypto();

  const navigation = useNavigation<
    CompositeNavigationProp<
      NativeStackNavigationProp<StackParamList, typeof SCREENS.MAIN>,
      BottomTabNavigationProp<TabParamList>
    >
  >();

  if (loading) return <Text></Text>;

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
            ${item.price_usd ? formattedBalance (item.price_usd, "" ) : "--"}</Text>
        </View>
      </View>

      {/* Right */}
      <View style={styles.right}>
        <Text style={styles.assetBalance}>
  {formattedBalance(item.balance, item.symbol, item.decimal_places ?? 8)}
</Text>
<Text style={styles.assetValue}>
  ${formattedBalance((item.balance ?? 0) * (item.price_usd ?? 0), "", 2)}
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

/*
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import API from "@lib/api";
import { routes } from "@constants/routes";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AccountParamList, HomeParamList, StackParamList, TabParamList } from "@navigators/types";
import { SCREENS } from "@constants/screens";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs/lib/typescript/src/types";


// ✅ Types
type Wallet = {
  name: string;
  balance: number;
  slug: string;
  decimal_places?: number;
};

type CryptoAsset = {
  id: number;
  name: string;
  symbol: string;
  icon_url?: string;
  price_usd?: number;
  balance?: number;
  decimal_places?: number;
};

const formatBalance = (value: number, decimals: number) =>
  parseFloat(value.toFixed(decimals)).toString();

const getDisplayDecimals = (symbol: string, defaultDecimals?: number) =>
  defaultDecimals ?? 8;

export default function CryptoOverview() {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  
  const navigation = useNavigation<
  CompositeNavigationProp<
    NativeStackNavigationProp<StackParamList, typeof SCREENS.MAIN>,
    BottomTabNavigationProp<TabParamList>
  >
>();

  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  const fetchData = async () => {
    try {
      API.defaults.baseURL = BASE_URL;

      const [pricesRes, walletsRes] = await Promise.all([
        API.get<{ success: boolean; data: CryptoAsset[] }>(
          routes.api.v1.services.cryptoAssets
        ),
        API.get<{ success: boolean; wallets: Wallet[] }>(
          routes.api.v1.services.wallets.list
        ),
      ]);

      if (!pricesRes.data.success || !walletsRes.data.success) {
        throw new Error("Failed to fetch data");
      }

      // Map wallets for quick lookup
      const walletsMap = walletsRes.data.wallets.reduce<Record<string, Wallet>>(
        (acc, w) => {
          acc[w.slug.toLowerCase()] = { ...w, balance: Number(w.balance) };
          return acc;
        },
        {}
      );


      // Merge wallet info with assets
      const merged = pricesRes.data.data.map((asset) => {
        const wallet = walletsMap[asset.symbol.toLowerCase()];

        // Construct full icon URL if available
        const fullIconUrl =
          asset.icon_url?.startsWith("http")
            ? asset.icon_url
            : asset.icon_url
            ? `${BASE_URL}/storage/app/public/crypto-icons/${asset.icon_url}`
            : undefined;

        return {
          ...asset,
          icon_url: fullIconUrl,
          balance: wallet?.balance ?? 0,
          decimal_places: wallet?.decimal_places ?? 8,
        };
      });

     // Sort by USD value descending before setting state
const sorted = merged.sort((a, b) => {
  const aValue = (a.balance ?? 0) * (a.price_usd ?? 0);
  const bValue = (b.balance ?? 0) * (b.price_usd ?? 0);
  return bValue - aValue; // High to low
});

setAssets(sorted);


    } catch (err) {
      console.error("Error fetching crypto data:", err);
      Alert.alert(
        "Network Error",
        "Unable to fetch crypto overview. Check your connection."
      );
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderItem = ({ item }: { item: CryptoAsset }) => (
    <View style={styles.card}>
      {/* Left
      <View style={styles.left}>
        <Image
          source={
            item.icon_url
              ? { uri: item.icon_url } // Remote icon
              : require("@assets/images/oops.png") // Fallback local icon
          }
          style={styles.icon}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.assetName}>{item.name}</Text>
          <Text style={styles.assetPrice}>
            {item.price_usd ? `$${item.price_usd.toFixed(2)}` : "--"}
          </Text>
        </View>
      </View>
      {/* Right 
      <View style={styles.right}>
        <Text style={styles.assetBalance}>
          {formatBalance(
            item.balance ?? 0,
            getDisplayDecimals(item.symbol, item.decimal_places)
          )}{" "}
          {item.symbol}
        </Text>
        <Text style={styles.assetValue}>
          ${((item.balance ?? 0) * (item.price_usd ?? 0)).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
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
*/
