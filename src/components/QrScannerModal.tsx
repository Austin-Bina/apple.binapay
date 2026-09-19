// components/QrScannerModal.tsx
import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
};

export default function QrScannerModal({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return; // prevent multiple rapid-fire scans
    setScanned(true);
    onScanned(data);
    onClose();
    // Reset after a short delay so the modal is fresh next time it opens
    setTimeout(() => setScanned(false), 500);
  };

  if (!visible) return null;

  if (!permission) {
    return null; // permissions still loading
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={s.permissionWrap}>
          <MaterialCommunityIcons name="camera-off-outline" size={48} color="#9ca3af" />
          <Text style={s.permissionText}>Camera access is needed to scan QR codes.</Text>
          <TouchableOpacity style={s.permissionBtn} onPress={requestPermission}>
            <Text style={s.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.closeLink} onPress={onClose}>
            <Text style={s.closeLinkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />

        <View style={s.overlay}>
          <View style={s.scanFrame} />
        </View>

        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={s.hintWrap}>
          <Text style={s.hintText}>Align QR code within the frame</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  scanFrame: {
    width: 250, height: 250, borderWidth: 2, borderColor: "#fff",
    borderRadius: 16, backgroundColor: "transparent",
  },
  closeBtn: {
    position: "absolute", top: Platform.OS === "ios" ? 60 : 30, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center",
  },
  hintWrap: { position: "absolute", bottom: 60, alignSelf: "center" },
  hintText: { color: "#fff", fontSize: 13, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  permissionWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  permissionText: { fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 16, marginBottom: 20 },
  permissionBtn: { backgroundColor: "#2563EB", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permissionBtnText: { color: "#fff", fontWeight: "700" },
  closeLink: { marginTop: 16 },
  closeLinkText: { color: "#6b7280", fontSize: 13 },
});
