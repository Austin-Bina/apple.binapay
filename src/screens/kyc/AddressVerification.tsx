import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubmitTier3Mutation } from "@store/redux-api/kycApi";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.ADDRESS_VERIFICATION>;

export default function AddressVerificationScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [submitTier3, { isLoading }]  = useSubmitTier3Mutation();

  const docs = [
    { label: "Utility Bill",         subtitle: "Electricity, Water, or Internet Bill",   icon: "flash",           color: "#f59e0b" },
    { label: "Bank Statement",       subtitle: "Issued within the last 3 months",         icon: "bank-outline",    color: "#3b82f6" },
    { label: "Government Document",  subtitle: "Driver's License, Voter's Card, etc.",    icon: "card-account-details-outline", color: "#f97316" },
  ];

  const handleContinue = async () => {
    if (!selectedDoc) {
      showToast({ variant: "warning", message: "Please select a document type." });
      return;
    }
    // In production: open image picker, upload, submit
    // For now: simulate success
    dispatch(authSliceActions.updateUser({ kyc_tier: 2 }));
    navigation.navigate(SCREENS.VERIFICATION_SUCCESS, { tier: 2 });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Address Verification</Text>
          <Text style={s.headerSub}>Verify Your Address</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={s.title}>Upload a document that shows your current residential address.</Text>

        <Text style={s.sectionLabel}>Accepted Documents</Text>
        {docs.map((doc) => (
          <TouchableOpacity
            key={doc.label}
            style={[s.docCard, selectedDoc === doc.label && s.docCardSelected]}
            onPress={() => setSelectedDoc(doc.label)}
            activeOpacity={0.8}
          >
            <View style={[s.docIcon, { backgroundColor: doc.color + "20" }]}>
              <MaterialCommunityIcons name={doc.icon as any} size={22} color={doc.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.docLabel}>{doc.label}</Text>
              <Text style={s.docSub}>{doc.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ))}

        <Text style={s.sectionLabel}>Upload Document</Text>
        <TouchableOpacity style={s.uploadBox}>
          <MaterialCommunityIcons name="cloud-upload-outline" size={36} color="#9ca3af" />
          <Text style={s.uploadText}>Tap to upload or drag and drop</Text>
          <Text style={s.uploadHint}>PDF, JPG or PNG (Max 5MB)</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.btn, (!selectedDoc || isLoading) && s.btnDisabled]}
          onPress={handleContinue}
          disabled={!selectedDoc || isLoading}
        >
          <Text style={s.btnText}>{isLoading ? "Submitting..." : "Continue"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#f8f9fb" },
  header:         { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:        { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:    { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:      { fontSize: 12, color: "#6b7280" },
  title:          { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  sectionLabel:   { fontSize: 13, fontWeight: "700", color: BRAND, marginBottom: 12, marginTop: 8 },
  docCard:        { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: "#f0f0f0" },
  docCardSelected:{ borderColor: BLUE, backgroundColor: "#f0f7ff" },
  docIcon:        { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  docLabel:       { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 2 },
  docSub:         { fontSize: 12, color: "#6b7280" },
  uploadBox:      { borderWidth: 2, borderColor: "#e5e7eb", borderStyle: "dashed", borderRadius: 14, padding: 32, alignItems: "center", backgroundColor: "#fff", gap: 8 },
  uploadText:     { fontSize: 14, color: "#374151", fontWeight: "500" },
  uploadHint:     { fontSize: 12, color: "#9ca3af" },
  footer:         { paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  btn:            { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  btnDisabled:    { opacity: 0.5 },
  btnText:        { fontSize: 16, fontWeight: "700", color: "#fff" },
});
