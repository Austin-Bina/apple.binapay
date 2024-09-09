import React from "react";
import { ActivityIndicator, Modal, ModalProps, Portal } from "react-native-paper";
import { StyleSheet, View } from "react-native";
import tw from "@lib/tailwind";

export default function PleaseWaitModal({
  style,
  ...rest
}: Omit<ModalProps, "children">) {
  return (
    <Portal>
      <Modal dismissable={false} style={[tw`flex-1 items-center justify-center`,style]} {...rest}>
        <View style={styles.modalContainerStyle}>
          <ActivityIndicator size="large" animating />
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainerStyle: {
    backgroundColor: "white",
    width: 60,
    height: 60,
    padding: 10,
    borderRadius: 12,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});
