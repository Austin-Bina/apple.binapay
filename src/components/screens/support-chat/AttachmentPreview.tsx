import React, { useMemo } from "react";
import { StyleSheet, Pressable, Image, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import tw from "@lib/tailwind";
import { formatBytes, isTypeImage } from "@utils/file";
import { ExpoAttachment } from "@type/app";

interface AttachmentPreviewProps {
  attachmentDetails: ExpoAttachment;
  onRemoveAttachment: () => void;
}

const AttachmentPreview = ({ attachmentDetails, onRemoveAttachment }: AttachmentPreviewProps) => {
  const { uri, name, size, mimeType } = attachmentDetails;
  const formattedFileSize = formatBytes(size, 0);

  return (
    <View style={tw`flex-1 flex-row items-center justify-between px-4 bg-white`}>
      {isTypeImage(mimeType || "") ? (
        <Image
          width={32}
          height={32}
          style={tw`rounded`}
          source={{
            uri,
          }}
        />
      ) : (
        <Icon source="file-document" size={20} />
      )}
      <Text style={tw`text-sm font-medium text-gray-900`}>
        {name!.length < 36 ? `${name}` : `...${name!.slice(name!.length - 15)}`}
      </Text>
      <Text style={tw`text-sm font-medium text-gray-900`}>{formattedFileSize}</Text>
      <Pressable onPress={onRemoveAttachment}>
        <Icon source="close" size={18} />
      </Pressable>
    </View>
  );
};

export default AttachmentPreview;
