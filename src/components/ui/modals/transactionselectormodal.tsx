import React from "react";
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { X } from "lucide-react-native"; 

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#666" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    elevation: 10,
  },
  closeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937", // gray-800
    textAlign: "center",
    marginBottom: 12,
  },
  content: {
    marginTop: 8,
  },
});
