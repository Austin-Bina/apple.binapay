import React from "react";
import { Modal, ModalProps, Portal, Text } from "react-native-paper";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function PleaseWaitModal({
  style,
  ...rest
}: Omit<ModalProps, "children">) {
  return (
    <Portal>
      <Modal dismissable={false} style={style} {...rest}>
        <View style={styles.modalContainerStyle}>
          <Text style={{ textAlign: "center" }}>Please wait...</Text>
          <ActivityIndicator size="large" animating />
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainerStyle: {
    marginHorizontal: "10%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});
