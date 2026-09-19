import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import API from "@lib/api";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.ADDRESS_VERIFICATION>;

export default function AddressVerificationScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();

  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [pickedFile, setPickedFile]   = useState<{
    uri: string; name: string; type: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const docs = [
    { label: "Utility Bill",        subtitle: "Electricity, Water, or Internet Bill",  icon: "flash",                        color: "#f59e0b" },
    { label: "Bank Statement",      subtitle: "Issued within the last 3 months",        icon: "bank-outline",                 color: "#3b82f6" },
    { label: "Government Document", subtitle: "Driver's License, Voter's Card, etc.",   icon: "card-account-details-outline", color: "#f97316" },
  ];

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? "image/jpeg",
      });
    }
  };

  const handleContinue = async () => {
    if (!selectedDoc) {
      showToast({ variant: "warning", message: "Please select a document type." });
      return;
    }
    if (!pickedFile) {
      showToast({ variant: "warning", message: "Please upload a document." });
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("document_type", selectedDoc);
      formData.append("proof", {
        uri: pickedFile.uri,
        name: pickedFile.name,
        type: pickedFile.type,
      } as any);

      const response = await API.post("/api/v1/kyc/address-verification", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

     dispatch(authSliceActions.updateUser(response.data.user));
      await dispatch(authSliceActions.fetchUserProfile());
     showToast({ 
  variant: "success", 
  message: "Document submitted! We'll review and verify within 24 hours." 
    });
navigation.navigate(SCREENS.VERIFICATION_HUB);

    } catch (error: any) {
      showToast({
        variant: "error",
        message: error?.response?.data?.message ?? "Submission failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Address Verification</Text>
          <Text style={s.headerSub}>Verify Your Address</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Upload a document that shows your current residential address.</Text>

        <Text style={s.sectionLabel}>Document Type</Text>
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
            {selectedDoc === doc.label
              ? <MaterialCommunityIcons name="check-circle" size={20} color={BLUE} />
              : <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
            }
          </TouchableOpacity>
        ))}

        <Text style={s.sectionLabel}>Upload Document</Text>
        <TouchableOpacity style={s.uploadBox} onPress={handlePickDocument} activeOpacity={0.8}>
          {pickedFile ? (
            <>
              {pickedFile.type === "application/pdf" ? (
                <MaterialCommunityIcons name="file-pdf-box" size={48} color="#ef4444" />
              ) : (
                <Image source={{ uri: pickedFile.uri }} style={s.previewImage} />
              )}
              <Text style={s.uploadTextSuccess} numberOfLines={1}>{pickedFile.name}</Text>
              <Text style={[s.uploadHint, { color: BLUE }]}>Tap to change</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="cloud-upload-outline" size={36} color="#9ca3af" />
              <Text style={s.uploadText}>Tap to upload document</Text>
              <Text style={s.uploadHint}>JPG, PNG or PDF (Max 5MB)</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.btn, (!selectedDoc || !pickedFile || isLoading) && s.btnDisabled]}
          onPress={handleContinue}
          disabled={!selectedDoc || !pickedFile || isLoading}
        >
          <Text style={s.btnText}>{isLoading ? "Submitting..." : "Submit for Review"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#f8f9fb" },
  header:           { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:          { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:      { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:        { fontSize: 12, color: "#6b7280" },
  title:            { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  sectionLabel:     { fontSize: 13, fontWeight: "700", color: BRAND, marginBottom: 12, marginTop: 8 },
  docCard:          { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: "#f0f0f0" },
  docCardSelected:  { borderColor: BLUE, backgroundColor: "#f0f7ff" },
  docIcon:          { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  docLabel:         { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 2 },
  docSub:           { fontSize: 12, color: "#6b7280" },
  uploadBox:        { borderWidth: 2, borderColor: "#e5e7eb", borderStyle: "dashed", borderRadius: 14, padding: 32, alignItems: "center", backgroundColor: "#fff", gap: 8 },
  uploadText:       { fontSize: 14, color: "#374151", fontWeight: "500" },
  uploadTextSuccess:{ fontSize: 13, color: "#111827", fontWeight: "500", textAlign: "center", maxWidth: "90%" },
  uploadHint:       { fontSize: 12, color: "#9ca3af" },
  previewImage:     { width: 120, height: 80, borderRadius: 8, marginBottom: 4 },
  footer:           { paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  btn:              { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  btnDisabled:      { opacity: 0.5 },
  btnText:          { fontSize: 16, fontWeight: "700", color: "#fff" },
});
