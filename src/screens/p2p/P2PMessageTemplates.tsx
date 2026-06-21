import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Switch,
 TouchableWithoutFeedback,
   Keyboard,
} from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import {
  useGetUserP2PSettingsQuery,
  useUpdateUserP2PSettingsMutation,
  P2PUserSettings,
} from "@store/redux-api/p2p";
import { showToast } from "@helpers/toast";

type Props = P2PStackScreenProps<"P2P Message Templates">;

const BRAND = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";

const MESSAGE_TEMPLATES = [
  {
    field: "msg_status_10_buy" as keyof P2PUserSettings,
    label: "New Buy Order",
    subtitle: "Sent when a buy order arrives",
    placeholder: "e.g. Hello! I'm active and ready to process your payment.",
    hint: null as string | null,
  },
  {
    field: "msg_status_10_sell" as keyof P2PUserSettings,
    label: "New Sell Order",
    subtitle: "Sent when a sell order arrives",
    placeholder: "e.g. Hello! I'm active and ready to release once payment is confirmed.",
    hint: null as string | null,
  },
  {
    field: "msg_status_20_buy" as keyof P2PUserSettings,
    label: "After Payment Sent",
    subtitle: "Sent after marking order as paid",
    placeholder: "e.g. Payment of $amount sent. Ref: $ref. Please release promptly.",
    hint: "Use $amount for payment amount and $ref for transaction reference." as string | null,
  },
  {
    field: "msg_status_20_sell" as keyof P2PUserSettings,
    label: "Awaiting Release",
    subtitle: "Sent when waiting for seller to release",
    placeholder: "e.g. Payment received. Releasing now. Please leave a positive review.",
    hint: null as string | null,
  },

  {
  field: "msg_status_10_followup" as keyof P2PUserSettings,
  label: "Follow-up Message",
  subtitle: "Sent if counterparty hasn't replied after delay",
  placeholder: "e.g. Hi, just checking in — are you still there?",
  hint: null,
},
];

export default function P2PMessageTemplatesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const { data: settingsData, isLoading } = useGetUserP2PSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateUserP2PSettingsMutation();

  const [messages, setMessages] = useState<Record<string, string | null>>({
    msg_status_10_buy:  null,
    msg_status_10_sell: null,
    msg_status_20_buy:  null,
    msg_status_20_sell: null,
  });

  const [validReplies, setValidReplies] = useState<string[]>([]);
  const [newReply, setNewReply]         = useState("");
  const [showRepliesModal, setShowRepliesModal] = useState(false);

  const [showMsgModal, setShowMsgModal] = useState<keyof P2PUserSettings | null>(null);
  const [editingMsg, setEditingMsg]     = useState("");
  const [followupDelay, setFollowupDelay] = useState("5");
  const [showFollowupDelayModal, setShowFollowupDelayModal] = useState(false);

  // ── Sync from backend ────────────────────────────────────────────────────
  useEffect(() => {
    const s = settingsData?.settings;
    
    if (!s) return;
    setMessages({
  msg_status_10_buy:      s.msg_status_10_buy      ?? null,
  msg_status_10_sell:     s.msg_status_10_sell     ?? null,
  msg_status_20_buy:      s.msg_status_20_buy      ?? null,
  msg_status_20_sell:     s.msg_status_20_sell     ?? null,
  msg_status_10_followup: s.msg_status_10_followup ?? null,  // ← load from backend
});
setFollowupDelay(String(s.followup_delay_minutes ?? 5));     // ← also sync delay
    setValidReplies(s.valid_replies ?? []);
  }, [settingsData]);

  const save = async (patch: Partial<P2PUserSettings>) => {
    try {
      await updateSettings(patch).unwrap();
    } catch {
      showToast({ message: "Failed to save. Please try again.", duration: 2500 });
    }
  };

  const addReply = () => {
    const trimmed = newReply.trim().toLowerCase();
    if (!trimmed || validReplies.indexOf(trimmed) !== -1 || validReplies.length >= 20) return;
    const updated = [...validReplies, trimmed];
    setValidReplies(updated);
    setNewReply("");
  };

  const removeReply = (word: string) => {
    setValidReplies(validReplies.filter((r) => r !== word));
  };
  
  const activeTemplate = showMsgModal
    ? MESSAGE_TEMPLATES.find((t) => t.field === showMsgModal)
    : null;

  const enabledCount = Object.keys(messages).filter((k) => messages[k] !== null).length;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F6FB" }}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableRipple onPress={() => navigation.goBack()} style={styles.backBtn} borderless>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableRipple>
        <Text style={styles.headerText}>Message Templates</Text>
        {isUpdating
          ? <ActivityIndicator size={18} color={BRAND} />
          : <View style={{ width: 32 }} />}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
       showsVerticalScrollIndicator={false}
       keyboardShouldPersistTaps="handled"
       onScrollBeginDrag={Keyboard.dismiss}
  >

        {/* ── Info banner ── */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="information-outline" size={18} color={BRAND} />
          <Text style={styles.infoText}>
            Configure automatic messages sent to your counterparty at different stages of a trade. Toggle off any message you don't want to send.
          </Text>
        </View>

        {/* ── Buy Order Messages ── */}
        <Text style={styles.sectionLabel}>Buy Order Messages</Text>
        <View style={styles.sectionCard}>
          {MESSAGE_TEMPLATES.filter((t) => (t.field as string).includes("buy")).map((tpl, idx) => {
            const value     = messages[tpl.field as string] ?? null;
            const isEnabled = value !== null;
            return (
              <React.Fragment key={tpl.field as string}>
                {idx > 0 && <View style={styles.divider} />}
                <TemplateRow
                  tpl={tpl}
                  value={value}
                  isEnabled={isEnabled}
                  onPress={() => {
                    setEditingMsg(value ?? "");
                    setShowMsgModal(tpl.field);
                  }}
                />
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Follow-up Message ── */}
<Text style={styles.sectionLabel}>Follow-up Message</Text>
<View style={styles.sectionCard}>
  {MESSAGE_TEMPLATES.filter((t) => t.field === "msg_status_10_followup").map((tpl) => {
    const value     = messages[tpl.field as string] ?? null;
    const isEnabled = value !== null;
    return (
      <TemplateRow
        key={tpl.field as string}
        tpl={tpl}
        value={value}
        isEnabled={isEnabled}
        onPress={() => {
          setEditingMsg(value ?? "");
          setShowMsgModal(tpl.field);
        }}
      />
    );
  })}

  <View style={styles.divider} />
  <TouchableRipple style={styles.settingRow} onPress={() => setShowFollowupDelayModal(true)}>
    <View style={styles.settingRowInner}>
      <View style={[styles.iconBox, { backgroundColor: "#FFF8E7" }]}>
        <MaterialCommunityIcons name="clock-outline" size={20} color="#F5A623" />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>Follow-up Delay</Text>
        <Text style={styles.settingSub}>Send follow-up after {followupDelay} minute{followupDelay !== "1" ? "s" : ""} of no reply</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
    </View>
  </TouchableRipple>
</View>

<Modal visible={showFollowupDelayModal} transparent animationType="slide">
   <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <View style={styles.modalOverlay}>
    <TouchableWithoutFeedback onPress={() => {}}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>Follow-up Delay</Text>
      <Text style={styles.modalHint}>
        How many minutes to wait before sending the follow-up message if the counterparty hasn't replied.
      </Text>
      <Text style={styles.modalLabel}>Minutes (1–60)</Text>
      <TextInput
        style={styles.modalInput}
        value={followupDelay}
        onChangeText={setFollowupDelay}
        keyboardType="numeric"
        placeholder="5"
        placeholderTextColor="#BBB"
      />
      <View style={styles.modalActions}>
        <TouchableRipple style={styles.modalCancel} onPress={() => setShowFollowupDelayModal(false)}>
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableRipple>
        <TouchableRipple
          style={styles.modalSave}
          onPress={async () => {
            const delay = Math.min(60, Math.max(1, parseInt(followupDelay) || 5));
            setFollowupDelay(String(delay));
            await save({ followup_delay_minutes: delay });
            setShowFollowupDelayModal(false);
            showToast({ message: "Follow-up delay saved.", duration: 1500 });
          }}>
          <Text style={styles.modalSaveText}>Save</Text>
        </TouchableRipple>
      </View>
      </View>
     </TouchableWithoutFeedback>
    </View>
   </TouchableWithoutFeedback>
</Modal>

        {/* ── Sell Order Messages ── */}
        <Text style={styles.sectionLabel}>Sell Order Messages</Text>
        <View style={styles.sectionCard}>
          {MESSAGE_TEMPLATES.filter((t) => (t.field as string).includes("sell")).map((tpl, idx) => {
            const value     = messages[tpl.field as string] ?? null;
            const isEnabled = value !== null;
            return (
              <React.Fragment key={tpl.field as string}>
                {idx > 0 && <View style={styles.divider} />}
                <TemplateRow
                  tpl={tpl}
                  value={value}
                  isEnabled={isEnabled}
                  onPress={() => {
                    setEditingMsg(value ?? "");
                    setShowMsgModal(tpl.field);
                  }}
                />
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.statusNote}>
          {enabledCount} of {MESSAGE_TEMPLATES.length} messages enabled
        </Text>

        {/* ── Fee Confirmation Words ── */}
        <Text style={styles.sectionLabel}>Fee Confirmation Words</Text>
        <View style={styles.sectionCard}>
          <TouchableRipple style={styles.settingRow} onPress={() => setShowRepliesModal(true)}>
            <View style={styles.settingRowInner}>
              <View style={[styles.iconBox, { backgroundColor: "#FFF3E0" }]}>
                <MaterialCommunityIcons name="comment-check-outline" size={20} color="#F5A623" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Valid Confirmation Words</Text>
                <Text style={styles.settingSub}>
                  {validReplies.length > 0
                    ? `${validReplies.length} word${validReplies.length > 1 ? "s" : ""} configured`
                    : "Using system defaults — tap to customise"}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
            </View>
          </TouchableRipple>
        </View>

        <View style={styles.sectionHint}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#AAA" />
          <Text style={styles.sectionHintText}>
            These words are used when fee mode is set to "Require confirmation". If empty, system defaults are used.
          </Text>
        </View>

      </ScrollView>

      {/* ── Edit message modal ── */}
      <Modal visible={showMsgModal !== null} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
           <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{activeTemplate?.label}</Text>
            <Text style={styles.modalHint}>{activeTemplate?.subtitle}</Text>

            <View style={styles.msgToggleRow}>
              <Text style={styles.modalLabel}>Enable this message</Text>
              <Switch
                value={editingMsg !== "__disabled__"}
                onValueChange={(val) => {
                  if (!val) setEditingMsg("__disabled__");
                  else setEditingMsg("");
                }}
                trackColor={{ false: "#E0E0E0", true: BRAND }}
                thumbColor="#fff"
              />
            </View>

            {editingMsg !== "__disabled__" && (
              <TextInput
                style={[styles.modalInput, { height: 110, textAlignVertical: "top" }]}
                value={editingMsg}
                onChangeText={setEditingMsg}
                placeholder={activeTemplate?.placeholder}
                placeholderTextColor="#BBB"
                multiline
                maxLength={500}
              />
            )}

            {activeTemplate?.hint && editingMsg !== "__disabled__" && (
              <View style={styles.varHintBox}>
                <MaterialCommunityIcons name="information-outline" size={14} color={BRAND} />
                <Text style={styles.varHint}>{activeTemplate.hint}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableRipple style={styles.modalCancel} onPress={() => setShowMsgModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.modalSave}
                onPress={async () => {
                  if (!showMsgModal) return;
                  const value = editingMsg === "__disabled__"
                    ? null : (editingMsg.trim() || null);
                  setMessages((prev) => ({ ...prev, [showMsgModal]: value }));
                  await save({ [showMsgModal]: value } as any);
                  setShowMsgModal(null);
                  showToast({ message: value ? "Message saved." : "Message disabled.", duration: 1500 });
                }}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableRipple>
            </View>
           </View>
           </TouchableWithoutFeedback>
        </View>
         </TouchableWithoutFeedback>
      </Modal>

      {/* ── Valid replies modal ── */}
      <Modal visible={showRepliesModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmation Words</Text>
            <Text style={styles.modalHint}>
              When your counterparty sends any of these words, BinaPay will process the fee deduction. Max 20 words. Tap a word to remove it.
            </Text>

            <View style={styles.tagsWrap}>
              {validReplies.map((word) => (
                <TouchableRipple
                  key={word}
                  style={styles.tag}
                  onPress={() => removeReply(word)}>
                  <View style={styles.tagInner}>
                    <Text style={styles.tagText}>{word}</Text>
                    <MaterialCommunityIcons name="close" size={12} color={BRAND} />
                  </View>
                </TouchableRipple>
              ))}
              {validReplies.length === 0 && (
                <Text style={[styles.modalHint, { fontStyle: "italic" }]}>
                  No custom words — system defaults will be used.
                </Text>
              )}
            </View>

            {validReplies.length < 20 && (
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInput}
                  value={newReply}
                  onChangeText={setNewReply}
                  placeholder='Type a word and press +'
                  placeholderTextColor="#BBB"
                  onSubmitEditing={addReply}
                  returnKeyType="done"
                />
                <TouchableRipple style={styles.tagAddBtn} onPress={addReply} borderless>
                  <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                </TouchableRipple>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableRipple style={styles.modalCancel} onPress={() => setShowRepliesModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.modalSave}
                onPress={async () => {
                  await save({ valid_replies: validReplies });
                  setShowRepliesModal(false);
                  showToast({ message: "Confirmation words saved.", duration: 1500 });
                }}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableRipple>
            </View>
          </View>
          </TouchableWithoutFeedback>
        </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

// ─── Template Row ─────────────────────────────────────────────────────────────
function TemplateRow({
  tpl,
  value,
  isEnabled,
  onPress,
}: {
  tpl: typeof MESSAGE_TEMPLATES[0];
  value: string | null;
  isEnabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableRipple style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingRowInner}>
        <View style={[styles.iconBox, { backgroundColor: isEnabled ? "#E8F5E9" : "#F5F5F5" }]}>
          <MaterialCommunityIcons
            name="message-text-outline"
            size={20}
            color={isEnabled ? "#2E7D32" : "#BBB"}
          />
        </View>
        <View style={styles.settingText}>
          <View style={styles.titleRow}>
            <Text style={styles.settingTitle}>{tpl.label}</Text>
            <View style={[styles.badge, { backgroundColor: isEnabled ? "#E8F5E9" : "#F5F5F5" }]}>
              <Text style={[styles.badgeText, { color: isEnabled ? "#2E7D32" : "#888" }]}>
                {isEnabled ? "ON" : "OFF"}
              </Text>
            </View>
          </View>
          <Text style={styles.settingSub} numberOfLines={1}>
            {isEnabled ? value! : tpl.subtitle}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB" },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#EFEFEF",
  },
  backBtn: { padding: 4, borderRadius: 20 },
  headerText: { fontSize: 16, fontWeight: "800", color: "#111" },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  infoBanner: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: BRAND_LIGHT, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: "#D6E4FF",
    marginBottom: 4,
  },
  infoText: { flex: 1, fontSize: 13, color: "#444", lineHeight: 19 },
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: "#888",
    textTransform: "uppercase", letterSpacing: 0.6,
    paddingLeft: 4, marginTop: 8, marginBottom: 4,
  },
  sectionCard: {
    backgroundColor: "#fff", borderRadius: 16,
    borderWidth: 1, borderColor: "#E8EEF9", overflow: "hidden",
  },
  sectionHint: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    paddingHorizontal: 4, marginTop: 2,
  },
  sectionHintText: { flex: 1, fontSize: 11, color: "#AAA", lineHeight: 16 },
  settingRow: {
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  settingRowInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 2 },
  settingSub: { fontSize: 12, color: "#888" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F0F4FB", marginLeft: 66 },
  statusNote: { textAlign: "center", fontSize: 12, color: "#AAA", marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 2 },
  modalHint: { fontSize: 12, color: "#888", lineHeight: 18 },
  modalLabel: { fontSize: 13, fontWeight: "700", color: "#555" },
  modalInput: {
    borderWidth: 1.5, borderColor: "#E8EEF9", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#111",
  },
  varHintBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: BRAND_LIGHT, borderRadius: 10, padding: 10,
    marginTop: -4,
  },
  varHint: { flex: 1, fontSize: 12, color: "#444", lineHeight: 18 },
  msgToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 30,
    borderWidth: 1.5, borderColor: "#D0D9EE", alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: "#555" },
  modalSave: { flex: 1.5, paddingVertical: 14, borderRadius: 30, backgroundColor: BRAND, alignItems: "center" },
  modalSaveText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Tags
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: BRAND_LIGHT, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tagInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  tagText: { fontSize: 13, color: BRAND, fontWeight: "600" },
  tagInputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  tagInput: {
    flex: 1, borderWidth: 1.5, borderColor: "#E8EEF9", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#111",
  },
  tagAddBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: BRAND, justifyContent: "center", alignItems: "center",
  },
});
