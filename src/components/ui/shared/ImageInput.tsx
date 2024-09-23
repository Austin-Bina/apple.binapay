import React, { Fragment, useState } from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Button, Icon, IconButton, Modal, Portal, Text, Title, useTheme } from "react-native-paper";
import { Asset, launchImageLibrary } from "react-native-image-picker";
import { findFileSize } from "@utils/file";
import tw from "@lib/tailwind";
import { Colors } from "@constants/theme/colors";
import { showToast } from "@helpers/toast";

type ImageInputProps = {
  source: any;
  onChangeImage: (imageObj: Asset) => void;
  onRemoveImage: () => void;
};

function ImageInput({ source, onChangeImage, onRemoveImage }: ImageInputProps) {
  const [visible, setVisible] = useState(false);

  const showModal = () => {
    if (source) {
      setVisible(true);
    }
  };
  const hideModal = () => setVisible(false);

  const handleImagePress = async () => {
    launchImageLibrary({ mediaType: "photo" }, (response) => {
      const attachment = response?.assets?.[0];
      if (!attachment) {
        return;
      }
      const { fileSize } = attachment;

      if (fileSize && findFileSize(fileSize) <= 2) {
        onChangeImage(attachment);
      } else {
        showToast({ message: "Image size should be less than 2MB" });
      }
    });
  };

  return (
    <View style={tw`items-center`}>
      <Pressable style={tw`flex justify-center items-center rounded-full relative`} onPress={handleImagePress}>
        <Avatar.Image size={100} source={source} style={tw`rounded-full bg-slate-200`} />
      </Pressable>

      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainerStyle}>
          <Title>Remove Image</Title>
          <Text style={{ textAlign: "center" }}>Are you sure you want to remove this Image?</Text>
          <View>
            <Button
              mode="outlined"
              style={{ marginTop: "8%" }}
              onPress={() => {
                hideModal();
              }}>
              No
            </Button>
            <Button
              mode="contained"
              style={{ marginTop: "8%" }}
              onPress={() => {
                hideModal();
                onRemoveImage();
              }}>
              Yes
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
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
export default ImageInput;
