import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetSupportFaqsQuery } from "@store/redux-api/supportApi";

const BRAND = "#1E3A8A";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SupportFaq({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useGetSupportFaqsQuery();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Support</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Frequently asked questions</Text>

        <View style={s.card}>
          {isLoading && <Text style={s.loading}>Loading…</Text>}
          {(data?.faqs ?? []).map((faq, i) => {
            const open = openIndex === i;
            return (
              <View key={i}>
                <TouchableOpacity style={s.row} onPress={() => toggle(i)} activeOpacity={0.7}>
                  <Text style={s.question}>{faq.question}</Text>
                  <MaterialCommunityIcons name={open ? "chevron-up" : "chevron-down"} size={20} color="#111827" />
                </TouchableOpacity>
                {open && <Text style={s.answer}>{faq.answer}</Text>}
                {i !== (data?.faqs.length ?? 0) - 1 && <View style={s.divider} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#111827" },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  title:  { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 14 },

  card:   { borderWidth: 1, borderColor: "#f0f0f0", borderRadius: 14, overflow: "hidden" },
  row:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  question: { flex: 1, fontSize: 14, color: "#111827", marginRight: 12 },
  answer:   { fontSize: 13, color: "#6b7280", lineHeight: 19, paddingHorizontal: 16, paddingBottom: 16 },
  divider:  { height: 1, backgroundColor: "#f3f4f6" },
  loading:  { padding: 16, color: "#9ca3af" },
});
