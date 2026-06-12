import React, { useEffect, useState } from "react";
import {
  View, StyleSheet, ScrollView, ActivityIndicator, TextInput,
  Modal, Switch, TouchableOpacity, Platform, StatusBar,
} from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import {
  useGetUserP2PSettingsQuery, useUpdateUserP2PSettingsMutation, P2PUserSettings,
} from "@store/redux-api/p2p";
import { showToast } from "@helpers/toast";

type Props = P2PStackScreenProps<"P2P Message Templates">;

const BRAND      = "#2563EB";
const BRAND_DARK = "#1E3A8A";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

const IOS_CARD = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
  android: { elevation: 1 },
});
const IOS_SHEET = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.10, shadowRadius: 20 },
  android: { elevation: 16 },
});

const MESSAGE_TEMPLATES = [
  { field: "msg_status_10_buy"      as keyof P2PUserSettings, label: "New Buy Order",       subtitle: "Sent when a buy order arrives",           placeholder: "e.g. Hello! I'm active and ready to process your payment.", hint: null as string | null },
  { field: "msg_status_10_sell"     as keyof P2PUserSettings, label: "New Sell Order",      subtitle: "Sent when a sell order arrives",           placeholder: "e.g. Hello! I'm active and ready to release once payment is confirmed.", hint: null as string | null },
  { field: "msg_status_20_buy"      as keyof P2PUserSettings, label: "After Payment Sent",  subtitle: "Sent after marking order as paid",         placeholder: "e.g. Payment of $amount sent. Ref: $ref.", hint: "Use $amount for payment amount and $ref for transaction reference." as string | null },
  { field: "msg_status_20_sell"     as keyof P2PUserSettings, label: "Awaiting Release",    subtitle: "Sent when waiting for seller to release",  placeholder: "e.g. Payment received. Releasing now.", hint: null as string | null },
  { field: "msg_status_10_followup" as keyof P2PUserSettings, label: "Follow-up Message",   subtitle: "Sent if counterparty hasn't replied",      placeholder: "e.g. Hi, just checking in — are you still there?", hint: null },
];

export default function P2PMessageTemplatesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const { data: settingsData, isLoading } = useGetUserP2PSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateUserP2PSettingsMutation();

  // ── All original state — untouched ────────────────────────────────────────
  const [messages, setMessages] = useState<Record<string, string | null>>({
    msg_status_10_buy: null, msg_status_10_sell: null, msg_status_20_buy: null, msg_status_20_sell: null,
  });
  const [validReplies, setValidReplies]   = useState<string[]>([]);
  const [newReply, setNewReply]           = useState("");
  const [showRepliesModal, setShowRepliesModal] = useState(false);
  const [showMsgModal, setShowMsgModal]   = useState<keyof P2PUserSettings | null>(null);
  const [editingMsg, setEditingMsg]       = useState("");
  const [followupDelay, setFollowupDelay] = useState("5");
  const [showFollowupDelayModal, setShowFollowupDelayModal] = useState(false);

  useEffect(() => {
    const s = settingsData?.settings; if (!s) return;
    setMessages({
      msg_status_10_buy:      s.msg_status_10_buy      ?? null,
      msg_status_10_sell:     s.msg_status_10_sell     ?? null,
      msg_status_20_buy:      s.msg_status_20_buy      ?? null,
      msg_status_20_sell:     s.msg_status_20_sell     ?? null,
      msg_status_10_followup: s.msg_status_10_followup ?? null,
    });
    setFollowupDelay(String(s.followup_delay_minutes ?? 5));
    setValidReplies(s.valid_replies ?? []);
  }, [settingsData]);

  const save = async (patch: Partial<P2PUserSettings>) => {
    try { await updateSettings(patch).unwrap(); }
    catch { showToast({ message: "Failed to save. Please try again.", duration: 2500 }); }
  };

  const addReply = () => {
    const trimmed = newReply.trim().toLowerCase();
    if (!trimmed || validReplies.indexOf(trimmed) !== -1 || validReplies.length >= 20) return;
    setValidReplies([...validReplies, trimmed]); setNewReply("");
  };
  const removeReply = (word: string) => setValidReplies(validReplies.filter(r => r !== word));

  const activeTemplate  = showMsgModal ? MESSAGE_TEMPLATES.find(t => t.field === showMsgModal) : null;
  const enabledCount    = Object.keys(messages).filter(k => messages[k] !== null).length;

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG }}>
      <ActivityIndicator size="large" color={BRAND} />
    </View>
  );

  return (
    <View style={[ms.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Nav */}
      <View style={ms.navBar}>
        <TouchableOpacity style={ms.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND_DARK} />
        </TouchableOpacity>
        <Text style={ms.navTitle}>Message Templates</Text>
        {isUpdating ? <ActivityIndicator size={18} color={BRAND} /> : <View style={{ width: 36 }} />}
      </View>

      <ScrollView contentContainerStyle={ms.scroll} showsVerticalScrollIndicator={false}>

        {/* Info banner */}
        <View style={[ms.infoBanner, IOS_CARD]}>
          <MaterialCommunityIcons name="information-outline" size={18} color={BRAND} />
          <Text style={ms.infoText}>Configure automatic messages sent at different stages of a trade.</Text>
        </View>

        {/* Buy messages */}
        <Text style={ms.sectionLabel}>Buy Order Messages</Text>
        <View style={[ms.sectionCard, IOS_CARD]}>
          {MESSAGE_TEMPLATES.filter(t => (t.field as string).includes("buy")).map((tpl, i, arr) => (
            <React.Fragment key={tpl.field as string}>
              {i > 0 && <View style={ms.hairline} />}
              <TemplateRow tpl={tpl} value={messages[tpl.field as string] ?? null}
                isEnabled={messages[tpl.field as string] !== null}
                onPress={() => { setEditingMsg(messages[tpl.field as string] ?? ""); setShowMsgModal(tpl.field); }} />
            </React.Fragment>
          ))}
        </View>

        {/* Follow-up */}
        <Text style={ms.sectionLabel}>Follow-up Message</Text>
        <View style={[ms.sectionCard, IOS_CARD]}>
          {MESSAGE_TEMPLATES.filter(t => t.field === "msg_status_10_followup").map(tpl => (
            <TemplateRow key={tpl.field as string} tpl={tpl} value={messages[tpl.field as string] ?? null}
              isEnabled={messages[tpl.field as string] !== null}
              onPress={() => { setEditingMsg(messages[tpl.field as string] ?? ""); setShowMsgModal(tpl.field); }} />
          ))}
          <View style={ms.hairline} />
          <TouchableOpacity style={ms.settingRow} onPress={() => setShowFollowupDelayModal(true)} activeOpacity={0.7}>
            <View style={[ms.iconBox, { backgroundColor: "#FFFBEB" }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ms.rowTitle}>Follow-up Delay</Text>
              <Text style={ms.rowSub}>Send follow-up after {followupDelay} minute{followupDelay !== "1" ? "s" : ""} of no reply</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={PLACEHOLDER} />
          </TouchableOpacity>
        </View>

        {/* Sell messages */}
        <Text style={ms.sectionLabel}>Sell Order Messages</Text>
        <View style={[ms.sectionCard, IOS_CARD]}>
          {MESSAGE_TEMPLATES.filter(t => (t.field as string).includes("sell")).map((tpl, i) => (
            <React.Fragment key={tpl.field as string}>
              {i > 0 && <View style={ms.hairline} />}
              <TemplateRow tpl={tpl} value={messages[tpl.field as string] ?? null}
                isEnabled={messages[tpl.field as string] !== null}
                onPress={() => { setEditingMsg(messages[tpl.field as string] ?? ""); setShowMsgModal(tpl.field); }} />
            </React.Fragment>
          ))}
        </View>

        <Text style={ms.statusNote}>{enabledCount} of {MESSAGE_TEMPLATES.length} messages enabled</Text>

        {/* Fee Confirmation Words */}
        <Text style={ms.sectionLabel}>Fee Confirmation Words</Text>
        <View style={[ms.sectionCard, IOS_CARD]}>
          <TouchableOpacity style={ms.settingRow} onPress={() => setShowRepliesModal(true)} activeOpacity={0.7}>
            <View style={[ms.iconBox, { backgroundColor: "#FFF7ED" }]}>
              <MaterialCommunityIcons name="comment-check-outline" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ms.rowTitle}>Valid Confirmation Words</Text>
              <Text style={ms.rowSub}>{validReplies.length > 0 ? `${validReplies.length} word${validReplies.length > 1 ? "s" : ""} configured` : "Using system defaults — tap to customise"}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={PLACEHOLDER} />
          </TouchableOpacity>
        </View>
        <Text style={ms.hintText}>These words trigger fee deduction when fee mode is "Require confirmation".</Text>
      </ScrollView>

      {/* ── Edit message modal ── */}
      <Modal visible={showMsgModal !== null} transparent animationType="slide">
        <View style={ms.modalOverlay}>
          <View style={[ms.modalCard, { paddingBottom: insets.bottom + 20 }, IOS_SHEET]}>
            <View style={ms.sheetHandle} />
            <Text style={ms.modalTitle}>{activeTemplate?.label}</Text>
            <Text style={ms.modalHint}>{activeTemplate?.subtitle}</Text>
            <View style={ms.toggleRow}>
              <Text style={ms.modalLabel}>Enable this message</Text>
              <Switch value={editingMsg !== "__disabled__"} onValueChange={val => { if (!val) setEditingMsg("__disabled__"); else setEditingMsg(""); }} trackColor={{ false: "#D1D5DB", true: BRAND }} thumbColor={SURFACE} />
            </View>
            {editingMsg !== "__disabled__" && (
              <TextInput style={[ms.modalInput, { height: 110, textAlignVertical: "top" }]} value={editingMsg} onChangeText={setEditingMsg} placeholder={activeTemplate?.placeholder} placeholderTextColor={PLACEHOLDER} multiline maxLength={500} />
            )}
            {activeTemplate?.hint && editingMsg !== "__disabled__" && (
              <View style={ms.hintBox}>
                <MaterialCommunityIcons name="information-outline" size={14} color={BRAND} />
                <Text style={ms.hintBoxText}>{activeTemplate.hint}</Text>
              </View>
            )}
            <View style={ms.modalActions}>
              <TouchableOpacity style={ms.cancelBtn} onPress={() => setShowMsgModal(null)} activeOpacity={0.8}>
                <Text style={ms.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ms.saveBtn} activeOpacity={0.85} onPress={async () => {
                if (!showMsgModal) return;
                const value = editingMsg === "__disabled__" ? null : (editingMsg.trim() || null);
                setMessages(prev => ({ ...prev, [showMsgModal]: value }));
                await save({ [showMsgModal]: value } as any);
                setShowMsgModal(null);
                showToast({ message: value ? "Message saved." : "Message disabled.", duration: 1500 });
              }}>
                <Text style={ms.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Followup delay modal ── */}
      <Modal visible={showFollowupDelayModal} transparent animationType="slide">
        <View style={ms.modalOverlay}>
          <View style={[ms.modalCard, { paddingBottom: insets.bottom + 20 }, IOS_SHEET]}>
            <View style={ms.sheetHandle} />
            <Text style={ms.modalTitle}>Follow-up Delay</Text>
            <Text style={ms.modalHint}>Minutes to wait before sending the follow-up message (1–60).</Text>
            <Text style={ms.modalLabel}>Minutes</Text>
            <TextInput style={ms.modalInput} value={followupDelay} onChangeText={setFollowupDelay} keyboardType="numeric" placeholder="5" placeholderTextColor={PLACEHOLDER} />
            <View style={ms.modalActions}>
              <TouchableOpacity style={ms.cancelBtn} onPress={() => setShowFollowupDelayModal(false)} activeOpacity={0.8}>
                <Text style={ms.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ms.saveBtn} activeOpacity={0.85} onPress={async () => {
                const delay = Math.min(60, Math.max(1, parseInt(followupDelay) || 5));
                setFollowupDelay(String(delay));
                await save({ followup_delay_minutes: delay });
                setShowFollowupDelayModal(false);
                showToast({ message: "Follow-up delay saved.", duration: 1500 });
              }}>
                <Text style={ms.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Valid replies modal ── */}
      <Modal visible={showRepliesModal} transparent animationType="slide">
        <View style={ms.modalOverlay}>
          <View style={[ms.modalCard, { paddingBottom: insets.bottom + 20 }, IOS_SHEET]}>
            <View style={ms.sheetHandle} />
            <Text style={ms.modalTitle}>Confirmation Words</Text>
            <Text style={ms.modalHint}>Tap a word to remove it. Max 20 words.</Text>
            <View style={ms.tagsWrap}>
              {validReplies.map(word => (
                <TouchableOpacity key={word} style={ms.tag} onPress={() => removeReply(word)} activeOpacity={0.75}>
                  <Text style={ms.tagText}>{word}</Text>
                  <MaterialCommunityIcons name="close" size={12} color={BRAND} />
                </TouchableOpacity>
              ))}
              {validReplies.length === 0 && <Text style={[ms.modalHint, { fontStyle: "italic" }]}>No custom words — system defaults will be used.</Text>}
            </View>
            {validReplies.length < 20 && (
              <View style={ms.tagInputRow}>
                <TextInput style={ms.tagInput} value={newReply} onChangeText={setNewReply} placeholder="Type a word and press +" placeholderTextColor={PLACEHOLDER} onSubmitEditing={addReply} returnKeyType="done" />
                <TouchableOpacity style={ms.tagAddBtn} onPress={addReply} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="plus" size={20} color={SURFACE} />
                </TouchableOpacity>
              </View>
            )}
            <View style={ms.modalActions}>
              <TouchableOpacity style={ms.cancelBtn} onPress={() => setShowRepliesModal(false)} activeOpacity={0.8}>
                <Text style={ms.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ms.saveBtn} activeOpacity={0.85} onPress={async () => {
                await save({ valid_replies: validReplies });
                setShowRepliesModal(false);
                showToast({ message: "Confirmation words saved.", duration: 1500 });
              }}>
                <Text style={ms.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TemplateRow({ tpl, value, isEnabled, onPress }: { tpl: typeof MESSAGE_TEMPLATES[0]; value: string | null; isEnabled: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={ms.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[ms.iconBox, { backgroundColor: isEnabled ? "#F0FDF4" : BG }]}>
        <MaterialCommunityIcons name="message-text-outline" size={20} color={isEnabled ? "#16A34A" : PLACEHOLDER} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <Text style={ms.rowTitle}>{tpl.label}</Text>
          <View style={[ms.badge, { backgroundColor: isEnabled ? "#F0FDF4" : BG }]}>
            <Text style={[ms.badgeText, { color: isEnabled ? "#16A34A" : SUBLABEL }]}>{isEnabled ? "ON" : "OFF"}</Text>
          </View>
        </View>
        <Text style={ms.rowSub} numberOfLines={1}>{isEnabled ? value! : tpl.subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={PLACEHOLDER} />
    </TouchableOpacity>
  );
}

const ms = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  navBar:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:      { fontSize: 16, fontWeight: "700", color: BRAND_DARK, letterSpacing: -0.3 },
  scroll:        { padding: 16, gap: 6, paddingBottom: 40 },
  sectionLabel:  { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, paddingLeft: 4, marginTop: 10, marginBottom: 6 },
  sectionCard:   { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  hairline:      { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 66 },
  infoBanner:    { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: BLUE_LIGHT, borderRadius: 13, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE", marginBottom: 4 },
  infoText:      { flex: 1, fontSize: 13, color: SUBLABEL, lineHeight: 19 },
  settingRow:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  iconBox:       { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  rowTitle:      { fontSize: 14, fontWeight: "600", color: LABEL },
  rowSub:        { fontSize: 12, color: SUBLABEL },
  badge:         { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeText:     { fontSize: 10, fontWeight: "700" },
  statusNote:    { textAlign: "center", fontSize: 12, color: PLACEHOLDER, marginTop: 4 },
  hintText:      { fontSize: 11, color: PLACEHOLDER, paddingHorizontal: 4, lineHeight: 16 },
  modalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard:     { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: SEPARATOR, alignSelf: "center", marginBottom: 12 },
  modalTitle:    { fontSize: 18, fontWeight: "700", color: BRAND_DARK },
  modalHint:     { fontSize: 12, color: SUBLABEL, lineHeight: 18 },
  modalLabel:    { fontSize: 13, fontWeight: "600", color: SUBLABEL },
  modalInput:    { borderWidth: 1.5, borderColor: SEPARATOR, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: LABEL },
  toggleRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hintBox:       { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: BLUE_LIGHT, borderRadius: 10, padding: 10 },
  hintBoxText:   { flex: 1, fontSize: 12, color: SUBLABEL, lineHeight: 18 },
  modalActions:  { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn:     { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: SEPARATOR, alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontWeight: "700", color: SUBLABEL },
  saveBtn:       { flex: 1.5, paddingVertical: 14, borderRadius: 14, backgroundColor: BRAND, alignItems: "center" },
  saveBtnText:   { fontSize: 15, fontWeight: "700", color: SURFACE },
  tagsWrap:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag:           { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BLUE_LIGHT, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tagText:       { fontSize: 13, color: BRAND, fontWeight: "600" },
  tagInputRow:   { flexDirection: "row", gap: 10, alignItems: "center" },
  tagInput:      { flex: 1, borderWidth: 1.5, borderColor: SEPARATOR, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: LABEL },
  tagAddBtn:     { width: 42, height: 42, borderRadius: 21, backgroundColor: BRAND, justifyContent: "center", alignItems: "center" },
});
