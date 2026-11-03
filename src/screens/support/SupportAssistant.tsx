import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { useGetSupportHubQuery } from "@store/redux-api/supportApi";
import { Avatar } from "react-native-paper";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";
const GENERAL_DEPARTMENT_ID = "1";

type ChipState = "idle" | "answered";

export default function SupportAssistant({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { data } = useGetSupportHubQuery();
  const [activeChipId, setActiveChipId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<Record<string, "resolved" | "unresolved">>({});

  const chips = data?.chips ?? [];
  const notice = data?.notice ?? null;

  const handleChipPress = (chipId: string) => {
    setActiveChipId(chipId);
  };

  const handleResolved = (chipId: string) => {
    setResolution((prev) => ({ ...prev, [chipId]: "resolved" }));
  };

  const handleUnresolved = (chipId: string) => {
    setResolution((prev) => ({ ...prev, [chipId]: "unresolved" }));
    const chip = chips.find((c) => c.id === chipId);
    navigation.navigate(SCREENS.SUPPORT_START_CONVERSATION, {
      departmentId: chip?.department_id || GENERAL_DEPARTMENT_ID,
      initialMessage: chip?.prompt,
    });
  };

  const handleTalkToAgent = () => {
    navigation.navigate(SCREENS.SUPPORT_START_CONVERSATION, {
      departmentId: GENERAL_DEPARTMENT_ID,
      initialMessage: "I'd like to speak with an agent, please.",
    });
  };

  const activeChip = chips.find((c) => c.id === activeChipId);
  const activeChipResolution = activeChipId ? resolution[activeChipId] : undefined;

  return (
    <View style={s.root}>
      <View style={[s.hero, { paddingTop: insets.top + 12 }]}>
  <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginBottom: 16 }}>
    <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
  </TouchableOpacity>
  <View style={s.heroBrandRow}>
    <View>
      <Text style={s.heroTitle}>Support</Text>
      <Text style={s.heroSub}>The team can also help</Text>
    </View>
  </View>
</View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.prompt}>Ask us anything, or share your feedback.</Text>

        {notice && (
          <View style={s.noticeCard}>
            <Text style={s.noticeIcon}>{notice.icon}</Text>
            <Text style={s.noticeText}>{notice.text}</Text>
          </View>
        )}

        <View style={s.agentRow}>
          <View style={s.agentAvatar}>
            <MaterialCommunityIcons name="robot-happy-outline" size={16} color={BLUE} />
          </View>
          <Text style={s.agentLabel}>BinaPay · AI Agent</Text>
        </View>
        <View style={s.agentBubble}>
          <Text style={s.agentBubbleText}>How may we help you today?</Text>
        </View>

        {activeChip && (
          <View style={s.agentBubble}>
            <Text style={s.agentBubbleText}>{activeChip.answer ?? activeChip.prompt}</Text>

            {!activeChipResolution && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={s.resolveBtn} onPress={() => handleResolved(activeChip.id)}>
                  <Text style={s.resolveBtnText}>Resolved</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.unresolveBtn} onPress={() => handleUnresolved(activeChip.id)}>
                  <Text style={s.unresolveBtnText}>Unresolved</Text>
                </TouchableOpacity>
              </View>
            )}
            {activeChipResolution === "resolved" && (
              <Text style={s.resolutionNote}>Glad we could help ✓</Text>
            )}
          </View>
        )}

        <View style={s.chipGrid}>
          {chips.map((chip) => (
            <TouchableOpacity
              key={chip.id}
              style={[s.chip, activeChipId === chip.id && s.chipActive]}
              onPress={() => handleChipPress(chip.id)}
              activeOpacity={0.8}
            >
              <Text style={s.chipEmoji}>{chip.emoji}</Text>
              <Text style={s.chipLabel}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[s.chip, s.chipAgent]} onPress={handleTalkToAgent} activeOpacity={0.8}>
            <MaterialCommunityIcons name="headset" size={16} color={BLUE} />
            <Text style={[s.chipLabel, { color: BLUE }]}>Talk to Agent</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f9fb" },
  hero: { backgroundColor: BRAND, paddingHorizontal: 20, paddingBottom: 20 },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  heroSub:   { fontSize: 13, color: "#dbeafe", marginTop: 2 },

  scroll: { padding: 16, gap: 12 },
  prompt: { fontSize: 13, color: "#6b7280", marginBottom: 4 },

  noticeCard: { flexDirection: "row", gap: 10, backgroundColor: "#f0fdf4", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#bbf7d0" },
  noticeIcon: { fontSize: 16 },
  noticeText: { flex: 1, fontSize: 13, color: "#166534", lineHeight: 18 },

  agentRow:    { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  agentAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  agentLabel:  { fontSize: 12, fontWeight: "700", color: "#374151" },
  agentBubble: { backgroundColor: "#f3f4f6", borderRadius: 14, borderTopLeftRadius: 2, padding: 14, alignSelf: "flex-start", maxWidth: "90%" },
  agentBubbleText: { fontSize: 14, color: "#111827" },

  resolveBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#dcfce7" },
  resolveBtnText:   { fontSize: 12, fontWeight: "600", color: "#16a34a" },
  unresolveBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#fee2e2" },
  unresolveBtnText: { fontSize: 12, fontWeight: "600", color: "#dc2626" },
  resolutionNote: { fontSize: 11, color: "#9ca3af", marginTop: 8 },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  chipActive:{ borderColor: BLUE },
  chipAgent:{ borderColor: BLUE, backgroundColor: "#EEF3FF" },
  chipEmoji:{ fontSize: 14 },
  chipLabel:{ fontSize: 13, fontWeight: "600", color: "#111827" },
  heroBrandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
heroAvatar:   { backgroundColor: "#EEF3FF" },
});
