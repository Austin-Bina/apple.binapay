import Screen from "@components/ui/shared/Screen";
import { systemUser } from "@constants/app";
import { SCREENS } from "@constants/screens";
import { getGiftedChatMessages } from "@helpers/chat-messages";
import tw from "@lib/tailwind";
import { useTypedSelector } from "@store/common";
import { useAddResponseMutation, useListConversationsQuery } from "@store/redux-api/supportApi";
import { selectUser } from "@store/selectors/auth";
import React, { useMemo, useState } from "react";
import { Platform, useWindowDimensions, View, StyleSheet, TouchableOpacity } from "react-native";
import { GiftedChat, IMessage, Send } from "react-native-gifted-chat";
import { ActivityIndicator, Avatar, IconButton, Text } from "react-native-paper";
import GiftedChatComponents from "@components/screens/support-chat";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { ExpoAttachment } from "@type/app";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { showToast } from "@helpers/toast";
import { MAXIMUM_FILE_UPLOAD_SIZE, MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES, formatBytes, findFileSize } from "@utils/file";
import AttachmentPreview from "@components/screens/support-chat/AttachmentPreview";
import { selectSupportDepartment } from "@store/selectors/support";
import RenderHTML from "react-native-render-html";
import { scale } from "react-native-size-matters";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SupportParamList, SupportStackScreenProps } from "@navigators/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@constants/theme/colors";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

type Props = NativeStackScreenProps<SupportParamList, typeof SCREENS.SUPPORT_CHAT>;

export default function ChatSupport({ navigation, route }: Props) {
  const { ticketId, departmentId } = route.params;
  const [attachmentDetails, setAttachmentDetails] = useState<ExpoAttachment | null>(null);
  const insets = useSafeAreaInsets();

  const { width }    = useWindowDimensions();
  const user         = useTypedSelector(selectUser);
  const department   = useTypedSelector(selectSupportDepartment(departmentId));
  const [addTicketResponse] = useAddResponseMutation();

  const { data: queryData, isLoading } = useListConversationsQuery(
    { conversationId: ticketId },
    {
      pollingInterval: 5000,
      skipPollingIfUnfocused: true,
      skip: !user || !ticketId,
    }
  );

  const inboxMessages = useMemo(() => {
    if (!user || !queryData?.data) return [];
    return getGiftedChatMessages(queryData.data.conversation, user, systemUser);
  }, [queryData, user]);

  const onRemoveAttachment  = () => setAttachmentDetails(null);
  const onSelectAttachment  = (attachment: ExpoAttachment | null) => {
    attachment ? setAttachmentDetails(attachment) : onRemoveAttachment();
  };

  const onSendMessage = async (message: IMessage) => {
    let data = { ticketId, message: message.text, attachment: "" };
    if (attachmentDetails) {
      const attachment = await FileSystem.readAsStringAsync(attachmentDetails.uri, { encoding: "base64" });
      data = { ...data, attachment };
      onRemoveAttachment();
    }
    await addTicketResponse(data).unwrap();
  };

  const handleImagePress = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
    if (!result.canceled) {
      const asset = result.assets[0];
      const { size } = asset;
      if (size && findFileSize(size) <= MAXIMUM_FILE_UPLOAD_SIZE) {
        onSelectAttachment(asset);
      } else {
        showToast({ message: `File exceeds limit of ${formatBytes(MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES)}` });
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ── Updated chat header ── */}
      <View style={[s.header]}>
        <TouchableOpacity style={s.backBtn} onPress={navigation.goBack}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <Avatar.Image size={36} style={s.avatar} source={require("@assets/icon.png")} />
        <View style={s.headerText}>
          <Text style={s.headerTitle}>BinaPay</Text>
          <Text style={s.headerSub}>{department?.name ? `${department.name} Team` : "Support"}</Text>
        </View>
        <View style={s.onlineDot} />
      </View>

      {/* ── Chat (all existing logic preserved) ── */}
      {isLoading ? (
        <ActivityIndicator style={tw`mt-6`} color={BLUE} />
      ) : (
        <GiftedChat
          keyboardShouldPersistTaps="handled"
          messages={inboxMessages}
          user={{ _id: user?.id || 1, ...user }}
          alignTop={true}
          isKeyboardInternallyHandled={false}
          renderUsernameOnMessage={true}
          showAvatarForEveryMessage={false}
          renderAvatarOnTop={false}
          messagesContainerStyle={tw`bg-gray-100`}
          onSend={(message) => onSendMessage(message[0])}
          renderBubble={GiftedChatComponents.renderBubble}
          renderLoading={() => <ActivityIndicator color={BLUE} />}
          renderActions={() => <IconButton icon="attachment" onPress={handleImagePress} />}
          renderSend={(props) => (
            <Send {...props}>
              <IconButton icon="send-check" containerColor={Colors.primary.DEFAULT} iconColor="white" size={24} />
            </Send>
          )}
          renderAccessory={() =>
            attachmentDetails && (
              <View style={tw`h-12`}>
                <AttachmentPreview
                  attachmentDetails={attachmentDetails}
                  onRemoveAttachment={() => onSelectAttachment(null)}
                />
              </View>
            )
          }
          renderMessageText={({ currentMessage, ...props }) => (
            <View style={tw`mx-4 py-2`}>
              <RenderHTML
                source={{ html: currentMessage.text }}
                contentWidth={scale(width)}
                tagsStyles={{ p: tw`my-2` }}
              />
            </View>
          )}
        />
      )}

      <PleaseWaitModal visible={isLoading} />
    </View>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:     { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  avatar:      { backgroundColor: "#EEF3FF" },
  headerText:  { flex: 1 },
  headerTitle: { fontSize: 14, fontWeight: "700", color: BRAND },
  headerSub:   { fontSize: 11, color: "#6b7280", marginTop: 1 },
  onlineDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16a34a" },
});
