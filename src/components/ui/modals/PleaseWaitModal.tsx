import React from "react";
import { Modal, ModalProps, Portal } from "react-native-paper";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import tw from "@lib/tailwind";

export default function PleaseWaitModal({
  style,
  ...rest
}: Omit<ModalProps, "children">) {
  return (
    <Portal>
      <Modal dismissable={false} style={[tw`items-center justify-center`,style]} {...rest}>
        <View style={styles.modalContainerStyle}>
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
    width: 50,
    height: 50,
    padding: 20,
    borderRadius: 12,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});
