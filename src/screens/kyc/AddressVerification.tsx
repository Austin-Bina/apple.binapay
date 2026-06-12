// ═══════════════════════════════════════════════════════════════════════════
// AddressVerificationScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubmitTier3Mutation } from "@store/redux-api/kycApi";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

type AddressProps = KYCStackScreenProps<typeof SCREENS.ADDRESS_VERIFICATION>;

export default function AddressVerificationScreen({ navigation }: AddressProps) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();

  // ── All original state + logic — untouched ────────────────────────────────
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [submitTier3, { isLoading }]  = useSubmitTier3Mutation();

  const docs = [
    { label: "Utility Bill",        subtitle: "Electricity, Water, or Internet Bill",  icon: "flash",                        color: "#F59E0B" },
    { label: "Bank Statement",      subtitle: "Issued within the last 3 months",        icon: "bank-outline",                 color: "#3B82F6" },
    { label: "Government Document", subtitle: "Driver's License, Voter's Card, etc.",   icon: "card-account-details-outline", color: "#F97316" },
  ];

  const handleContinue = async () => {
    if (!selectedDoc) { showToast({ variant: "warning", message: "Please select a document type." }); return; }
    dispatch(authSliceActions.updateUser({ kyc_tier: 2 }));
    navigation.navigate(SCREENS.VERIFICATION_SUCCESS, { tier: 2 });
  };

  return (
    <View style={[av.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Nav */}
      <View style={av.navBar}>
        <TouchableOpacity style={av.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={av.navCenter}>
          <Text style={av.navTitle}>Address Verification</Text>
          <Text style={av.navSub}>Verify your residential address</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={av.scroll} showsVerticalScrollIndicator={false}>
        <Text style={av.pageDesc}>Upload a document that confirms your current residential address.</Text>

        {/* Document selector */}
        <Text style={av.sectionLabel}>Accepted Documents</Text>
        <View style={[av.docsCard, IOS_SHADOW]}>
          {docs.map((doc, i) => (
            <React.Fragment key={doc.label}>
              {i > 0 && <View style={av.hairline} />}
              <TouchableOpacity
                style={[av.docRow, selectedDoc === doc.label && av.docRowSelected]}
                onPress={() => setSelectedDoc(doc.label)}
                activeOpacity={0.8}>
                <View style={[av.docIconWrap, { backgroundColor: doc.color + "18" }]}>
                  <MaterialCommunityIcons name={doc.icon as any} size={22} color={doc.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={av.docLabel}>{doc.label}</Text>
                  <Text style={av.docSub}>{doc.subtitle}</Text>
                </View>
                {selectedDoc === doc.label
                  ? <MaterialCommunityIcons name="check-circle" size={20} color={BLUE} />
                  : <MaterialCommunityIcons name="chevron-right" size={18} color={PLACEHOLDER} />}
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Upload zone */}
        <Text style={av.sectionLabel}>Upload Document</Text>
        <TouchableOpacity style={[av.uploadBox, IOS_SHADOW]} activeOpacity={0.8}>
          <View style={av.uploadIconWrap}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={32} color={BLUE} />
          </View>
          <Text style={av.uploadText}>Tap to upload</Text>
          <Text style={av.uploadHint}>PDF, JPG or PNG · Max 5MB</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[av.footer, { paddingBottom: insets.bottom + 16 }, IOS_SHEET_SHADOW]}>
        <TouchableOpacity
          style={[av.btn, (!selectedDoc || isLoading) && av.btnDisabled]}
          onPress={handleContinue}
          disabled={!selectedDoc || isLoading}
          activeOpacity={0.85}>
          <Text style={av.btnText}>{isLoading ? "Submitting…" : "Continue"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const av = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  navBar:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:    { flex: 1, alignItems: "center" },
  navTitle:     { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:       { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  scroll:       { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  pageDesc:     { fontSize: 14, color: SUBLABEL, lineHeight: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10, marginLeft: 4 },
  docsCard:     { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 20 },
  hairline:     { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 64 },
  docRow:       { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, minHeight: 64 },
  docRowSelected: { backgroundColor: "#F0F7FF" },
  docIconWrap:  { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  docLabel:     { fontSize: 14, fontWeight: "600", color: LABEL, marginBottom: 2 },
  docSub:       { fontSize: 12, color: SUBLABEL },
  uploadBox:    { backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1.5, borderColor: SEPARATOR, borderStyle: "dashed", padding: 32, alignItems: "center", gap: 8 },
  uploadIconWrap:{ width: 56, height: 56, borderRadius: 28, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  uploadText:   { fontSize: 14, color: LABEL, fontWeight: "600" },
  uploadHint:   { fontSize: 12, color: PLACEHOLDER },
  footer:       { paddingHorizontal: 16, paddingTop: 12, backgroundColor: SURFACE, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR },
  btn:          { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  btnDisabled:  { opacity: 0.5 },
  btnText:      { fontSize: 16, fontWeight: "700", color: SURFACE },
});
