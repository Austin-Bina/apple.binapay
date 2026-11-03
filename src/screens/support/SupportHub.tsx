import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { SCREENS } from "@constants/screens";
import { useGetSupportHubQuery } from "@store/redux-api/supportApi";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";
const GENERAL_DEPARTMENT_ID = "1";
const FALLBACK_REVIEW = { ios: "", android: "" };

const FALLBACK_LINKS = {
  blog: "https://support.binapay.co",
  website: "https://binapay.co",
  x: "https://x.com/binapay_app",
  videos: "",
};

export default function SupportHub({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user = useTypedSelector(selectUser);
  const { data: hubData } = useGetSupportHubQuery();
  const links = hubData?.links ?? FALLBACK_LINKS;
 
  const review = hubData?.review ?? FALLBACK_REVIEW;
  const reviewUrl = Platform.OS === "ios" ? review.ios : review.android;
  const goToAssistant = () => {
    navigation.navigate(SCREENS.SUPPORT_ASSISTANT);
  };

  const goToFaq = () => {
    navigation.navigate(SCREENS.SUPPORT_FAQ);
  };

   const goToMessages = () => {
      navigation.navigate(SCREENS.SUPPORT_HISTORY);
  };

  const goToNewConversation = () => {
    navigation.navigate(SCREENS.SUPPORT_START_CONVERSATION, {
      departmentId: GENERAL_DEPARTMENT_ID,
    });
  };

  const openExternal = (url: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={s.root}>
      <View style={[s.hero, { paddingTop: insets.top + 12 }]}>
        <View style={s.heroTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={s.heroGreeting}>Hi {user?.name?.split(" ")[0] ?? "there"} 👋</Text>
        <Text style={s.heroTitle}>How can we help?</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <TouchableOpacity style={s.navRow} onPress={goToMessages }>
            <Text style={s.navRowText}>Messages</Text>
            <MaterialCommunityIcons name="message-text-outline" size={18} color="#111827" />
          </TouchableOpacity>
          <View style={s.rowDivider} />
          <TouchableOpacity style={s.navRow} onPress={goToFaq}>
            <Text style={s.navRowText}>FAQ</Text>
            <MaterialCommunityIcons name="help-circle-outline" size={18} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <ExternalRow label="Visit our Blog" onPress={() => openExternal(links.blog)} />
          <View style={s.rowDivider} />
          <ExternalRow label="Visit our Website" onPress={() => openExternal(links.website)} />
          <View style={s.rowDivider} />
          <ExternalRow label="Follow us on X" onPress={() => openExternal(links.x)} />
          {!!links.videos && (
            <>
              <View style={s.rowDivider} />
              <ExternalRow label="BinaPay Help Videos" onPress={() => openExternal(links.videos)} />
            </>
          )}
           {!!reviewUrl && (
    <>
      <View style={s.rowDivider} />
      <ExternalRow label="Leave a Review" onPress={() => openExternal(reviewUrl)} />
    </>
  )}
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={s.sendBtn} onPress={goToAssistant} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={s.sendBtnTitle}>Send us a message</Text>
            <Text style={s.sendBtnSub}>We typically reply in a few minutes</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#111827" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ExternalRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.navRow} onPress={onPress}>
      <Text style={s.navRowText}>{label}</Text>
      <MaterialCommunityIcons name="open-in-new" size={16} color="#6b7280" />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#f8f9fb" },
  hero:   { backgroundColor: BRAND, paddingHorizontal: 20, paddingBottom: 28 },
  heroTopRow:  { flexDirection: "row", marginBottom: 20 },
  heroGreeting:{ fontSize: 15, color: "#dbeafe", marginBottom: 4 },
  heroTitle:   { fontSize: 24, fontWeight: "800", color: "#fff" },

  scroll: { padding: 16, paddingTop: 14, gap: 12 },

  card:   { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },
  navRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  navRowText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  rowDivider: { height: 1, backgroundColor: "#f3f4f6" },

  footer:  { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingHorizontal: 16, paddingTop: 12 },
  sendBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8f9fb", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", padding: 14 },
  sendBtnTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  sendBtnSub:   { fontSize: 11, color: "#6b7280", marginTop: 2 },
});
