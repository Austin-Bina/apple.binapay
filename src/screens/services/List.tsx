import React, { useCallback, useRef } from "react";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import UserAppbar from "@components/UserAppbar";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { Image } from "react-native-element-image";
import { Button } from "react-native-paper";
import { getNavigate } from "@utils/navigation";
import { scale } from "react-native-size-matters";

type Props = ServicesStackScreenProps<"List">;

const BLUE = "#2563EB";
const BRAND = "#1E3A8A";

type ServiceItem = {
  icon: string;
  label: string;
  onPress: () => void;
  comingSoon?: boolean;
};

export default function ListServicesScreen({ navigation }: Props) {
  const bottomSheet = useRef<BottomSheetModalMethods>(null);

  const openBottomSheet = useCallback(() => bottomSheet.current?.present(), []);
  const closeBottomSheet = useCallback(() => bottomSheet.current?.dismiss(), []);

  const services: ServiceItem[] = [
    {
      icon: "phone",
      label: "Airtime Purchase",
      onPress: () => navigation.navigate("Airtime Purchase"),
    },
    {
      icon: "wifi",
      label: "Data Bundle",
      onPress: () => navigation.navigate("Data Purchase"),
    },
    {
      icon: "lightning-bolt",
      label: "Electricity",
      onPress: () => navigation.navigate("Electricity Bill"),
    },
    {
      icon: "television-play",
      label: "TV Subscription",
      onPress: () => navigation.navigate("TV Subscription"),
    },
    {
      icon: "school-outline",
      label: "Education Payments",
      onPress: () => navigation.navigate("Education", { screen: "Select Educational Payment" }),
    },
    {
      icon: "barcode-scan",
      label: "Airtime EPIN Purchase & Printing",
      onPress: () => navigation.navigate("Airtime EPIN Purchase"),
    },
    {
      icon: "cable-data",
      label: "Internet Subscription",
      onPress: openBottomSheet,
      comingSoon: true,
    },
    
    {
      icon: "gift-outline",
      label: "Get Reward on BinaPay",
      onPress: async () => {
        const { navigate } = await getNavigate();
        navigate("Main", { screen: "Menu", params: { screen: "BinaPay Rewards" } });
      },
    },
   
    {
      icon: "card-giftcard" as any,
      label: "Gift Card",
      onPress: openBottomSheet,
      comingSoon: true,
    },
    {
      icon: "ticket-outline",
      label: "Event Tickets",
      onPress: openBottomSheet,
      comingSoon: true,
    },
    {
      icon: "airplane",
      label: "Flight Booking",
      onPress: openBottomSheet,
      comingSoon: true,
    },
  ];

  return (
    <Screen>
      <UserAppbar />
      <ScrollableView style={tw`flex-1`} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>

        {/* ── Popular Services header ── */}
        <Text style={s.pageTitle}>Popular Services</Text>

        {/* ── 4-column grid ── */}
        <View style={s.grid}>
          {services.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={s.serviceItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={s.serviceIconWrap}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={BLUE} />
              </View>
              <Text style={s.serviceLabel} numberOfLines={2}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Promo banner ── */}
        <View style={s.promoBanner}>
          <View style={s.promoBannerLeft}>
            <Text style={s.promoBannerTitle}>Pay bills, buy airtime,{"\n"}and send money</Text>
            <Text style={s.promoBannerSub}>All in one place with BinaPay.</Text>
            <TouchableOpacity style={s.promoBtn} activeOpacity={0.85}>
              <Text style={s.promoBtnText}>Explore More</Text>
            </TouchableOpacity>
          </View>
          <View style={s.promoBannerRight}>
            <MaterialCommunityIcons name="cellphone-check" size={80} color="rgba(255,255,255,0.25)" />
          </View>
        </View>

      </ScrollableView>

      {/* ── Coming Soon sheet ── */}
      <BottomSheetModal
        ref={bottomSheet}
        initialSnapPoints={["52%", "52%"]}
        enablePanDownToClose
        onDismiss={closeBottomSheet}
        scrollable={false}
        children={
          <View style={tw`flex-1 items-center px-6`}>
            <Image source={require("@assets/images/oops.png")} width={scale(180)} style={tw`mb-4`} />
            <Text style={s.comingSoonTitle}>Service Coming Soon</Text>
            <Text style={s.comingSoonSub}>
              This service is not available yet. We're actively working to add more features. Please check back later.
            </Text>
            <Button
              mode="contained"
              onPress={closeBottomSheet}
              style={tw`w-full rounded-full mt-4`}
              contentStyle={tw`py-2`}
            >
              Back
            </Button>
          </View>
        }
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  pageTitle:        { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 16 },

  // 4-column grid
  grid:             { flexDirection: "row", flexWrap: "wrap", gap: 0 },
  serviceItem:      { width: "25%", alignItems: "center", paddingVertical: 14, paddingHorizontal: 4 },
  serviceIconWrap:  { width: 52, height: 52, borderRadius: 16, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  serviceLabel:     { fontSize: 11, color: "#374151", textAlign: "center", lineHeight: 15, fontWeight: "500" },

  // Promo banner
  promoBanner:      { flexDirection: "row", backgroundColor: BRAND, borderRadius: 18, padding: 20, marginTop: 20, overflow: "hidden" },
  promoBannerLeft:  { flex: 1 },
  promoBannerRight: { justifyContent: "center", alignItems: "center" },
  promoBannerTitle: { fontSize: 16, fontWeight: "800", color: "#fff", lineHeight: 22, marginBottom: 4 },
  promoBannerSub:   { fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 16 },
  promoBtn:         { backgroundColor: BLUE, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, alignSelf: "flex-start" },
  promoBtnText:     { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Coming soon sheet
  comingSoonTitle:  { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 8, textAlign: "center" },
  comingSoonSub:    { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 20 },
});
