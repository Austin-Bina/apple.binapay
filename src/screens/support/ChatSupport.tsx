import { systemUser } from "@constants/app";
import { SCREENS } from "@constants/screens";
import { getGiftedChatMessages } from "@helpers/chat-messages";
import tw from "@lib/tailwind";
import { useTypedSelector } from "@store/common";
import { useAddResponseMutation, useListConversationsQuery } from "@store/redux-api/supportApi";
import { selectUser } from "@store/selectors/auth";
import React, { useMemo, useState, useRef } from "react";
import { Platform, useWindowDimensions, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, TextInput, TouchableWithoutFeedback, Keyboard, Linking  } from "react-native";
import { GiftedChat, IMessage, InputToolbar, Composer } from "react-native-gifted-chat";
import { ActivityIndicator, Avatar, IconButton, Text } from "react-native-paper";
import GiftedChatComponents from "@components/screens/support-chat";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { ExpoAttachment } from "@type/app";
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from "expo-document-picker";
import { showToast } from "@helpers/toast";
import { MAXIMUM_FILE_UPLOAD_SIZE, MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES, formatBytes, findFileSize } from "@utils/file";
import AttachmentPreview from "@components/screens/support-chat/AttachmentPreview";
import { selectSupportDepartment } from "@store/selectors/support";
import RenderHTML from "react-native-render-html";
import { scale } from "react-native-size-matters";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SupportParamList } from "@navigators/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@constants/theme/colors";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

type Props = NativeStackScreenProps<SupportParamList, typeof SCREENS.SUPPORT_CHAT>;

export default function ChatSupport({ navigation, route }: Props) {
  const { ticketId, departmentId } = route.params;
  const [attachmentDetails, setAttachmentDetails] = useState<ExpoAttachment | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);
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

  const onSendMessage = async () => {
  if (!inputText.trim() && !attachmentDetails) return;
  try {
    setIsSending(true);
    let data: any = { ticketId, message: inputText.trim() || " ",
       attachment: "" };
    if (attachmentDetails) {
      const attachment = await FileSystem.readAsStringAsync(attachmentDetails.uri, { encoding: "base64" });
      data = { ...data, attachment, attachment_mime: attachmentDetails.mimeType, attachment_name: attachmentDetails.name,};
      onRemoveAttachment();
    }
    await addTicketResponse(data).unwrap();
    setInputText("");
  } catch (e: any) {
    console.log("SEND ERROR:", JSON.stringify(e));  // ← add this
    showToast({ message: e?.data?.message ?? "Failed to send message. Please try again." });
  } finally {
    setIsSending(false);
  }
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <Avatar.Image size={36} style={s.avatar} source={require("@assets/icon.png")} />
        <View style={s.headerText}>
          <Text style={s.headerTitle}>BinaPay</Text>
          <Text style={s.headerSub}>{department?.name ? `${department.name} Team` : "Support"}</Text>
        </View>
        <View style={s.onlineDot} />
      </View>

      {/* Messages */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
        {isLoading ? (
          <ActivityIndicator style={tw`mt-6`} color={BLUE} />
        ) : (
          <GiftedChat
            messages={inboxMessages}
            user={{ _id: user?.id || 1, ...user }}
            alignTop={true}
            isKeyboardInternallyHandled={false}
            renderUsernameOnMessage={true}
            showAvatarForEveryMessage={false}
            renderAvatarOnTop={false}
            messagesContainerStyle={tw`bg-gray-100`}
            onSend={() => {}}
            renderBubble={GiftedChatComponents.renderBubble}
            renderLoading={() => <ActivityIndicator color={BLUE} />}
            renderInputToolbar={() => null}
            renderMessageText={({ currentMessage, ...props }) => (
              <View style={tw`mx-4 py-2`}>
                <RenderHTML
                  source={{ html: currentMessage.text }}
                  contentWidth={scale(width)}
                   tagsStyles={{
                    p: tw`my-2`,
                    a: { color: "#2563EB", textDecorationLine: "underline" },
                       }}
                    renderersProps={{
                           a: {
                 onPress: (_event, href) => {
            Linking.openURL(href).catch(() => {});
          },
        },
      }}
                />
              </View>
            )}
          />
        )}
      </View>
      </TouchableWithoutFeedback>

      {/* Attachment preview */}
      {attachmentDetails && (
        <AttachmentPreview
          attachmentDetails={attachmentDetails}
          onRemoveAttachment={() => onSelectAttachment(null)}
        />
      )}

      {/* Custom input bar */}
      <View style={[s.inputBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity onPress={handleImagePress} style={s.attachBtn}>
          <MaterialCommunityIcons name="attachment" size={22} color="#6b7280" />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={s.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[s.sendBtn, (!inputText.trim() && !attachmentDetails) && s.sendBtnDisabled]}
          onPress={onSendMessage}
          disabled={isSending || (!inputText.trim() && !attachmentDetails)}
        >
          {isSending
            ? <ActivityIndicator size={18} color="#fff" />
            : <MaterialCommunityIcons name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      <PleaseWaitModal visible={isLoading} />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header:          { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:         { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  avatar:          { backgroundColor: "#EEF3FF" },
  headerText:      { flex: 1 },
  headerTitle:     { fontSize: 14, fontWeight: "700", color: BRAND },
  headerSub:       { fontSize: 11, color: "#6b7280", marginTop: 1 },
  onlineDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16a34a" },
  attachBtn:       { width: 36, height: 36, justifyContent: "center", alignItems: "center", marginBottom: 2 },
  textInput:       { flex: 1, minHeight: 36, maxHeight: 120, backgroundColor: "#f3f4f6", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: "#111827" },
  sendBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE, justifyContent: "center", alignItems: "center", marginBottom: 2 },
  sendBtnDisabled: { backgroundColor: "#93c5fd" },
  inputBar: { 
  flexDirection: "row", 
  alignItems: "flex-end", 
  gap: 8, 
  paddingHorizontal: 12, 
  paddingTop: 12,      
  backgroundColor: "#fff", 
  borderTopWidth: 1, 
  borderTopColor: "#f0f0f0" 
},
});
