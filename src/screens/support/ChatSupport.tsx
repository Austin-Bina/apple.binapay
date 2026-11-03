import { systemUser } from "@constants/app";
import { SCREENS } from "@constants/screens";
import { getGiftedChatMessages } from "@helpers/chat-messages";
import tw from "@lib/tailwind";
import { useTypedSelector } from "@store/common";
import { useAddResponseMutation, useListConversationsQuery } from "@store/redux-api/supportApi";
import { selectUser } from "@store/selectors/auth";
import React, { useMemo, useState, useRef } from "react";
import { Platform, useWindowDimensions, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, TextInput, TouchableWithoutFeedback, Keyboard, Linking, Image } from "react-native";
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
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { useAiAutoReplyMutation, useMarkAiResolutionMutation, useGetAiConfigQuery, useGetAiStateQuery } from "@store/redux-api/supportApi";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

type Props = NativeStackScreenProps<SupportParamList, typeof SCREENS.SUPPORT_CHAT>;

// ── Module-scope helpers — never recreated on render, parsing only runs
// once per message (see useMemo below), never on every keystroke/poll.
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "txt"];
const ATTACHMENT_LINE_REGEX = /Attachment:\s*(?:<a[^>]*href=["']([^"']+)["'][^>]*>.*?<\/a>|(\S+))\s*$/i;
const DATA_IMG_REGEX = /<img[^>]*src=["'](data:image\/[a-zA-Z0-9+.\-]+;base64,[^"']+)["'][^>]*>/gi;
const MAX_INLINE_IMAGE_CHARS = 1_500_000; // guards against an oversized pasted screenshot

type ParsedMessage = {
  bodyWithoutAttachment: string;
  imageUrl: string | null;
  documentUrl: string | null;
  documentName: string | null;
  inlineImages: string[];
};

function parseMessage(text: unknown): ParsedMessage {
    console.log("PARSE INPUT:", typeof text, (text as string)?.length, (text as string)?.slice(0, 100));

  if (typeof text !== "string" || !text) {
    return { bodyWithoutAttachment: typeof text === "string" ? text : "", imageUrl: null, documentUrl: null, documentName: null, inlineImages: [] };
  }

  // Step 1: pull out any raw base64 <img> tags pasted directly into the
  // HTML (e.g. admin pasting a screenshot into HelpDeskZ's rich-text box).
  // These are never real "attachments" — just inline image data — so they
  // must be stripped before RenderHTML ever sees the string.
  const inlineImages: string[] = [];
  let working = text.replace(DATA_IMG_REGEX, (_match, src) => {
    if (src.length <= MAX_INLINE_IMAGE_CHARS) inlineImages.push(src);
    return "";
  });

  // Step 2: handle the "Attachment: url" convention our own upload path uses.
  const match = working.match(ATTACHMENT_LINE_REGEX);
  if (!match) {
    return { bodyWithoutAttachment: working, imageUrl: null, documentUrl: null, documentName: null, inlineImages };
  }

  const url = match[1] || match[2];
  if (!url) {
    return { bodyWithoutAttachment: working, imageUrl: null, documentUrl: null, documentName: null, inlineImages };
  }

  const bodyWithoutAttachment = working.slice(0, match.index).trim();
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const fileName = url.split("/").pop() ?? "Attachment";

  if (IMAGE_EXTENSIONS.includes(ext)) {
    return { bodyWithoutAttachment, imageUrl: url, documentUrl: null, documentName: null, inlineImages };
  }
  if (DOCUMENT_EXTENSIONS.includes(ext)) {
    return { bodyWithoutAttachment, imageUrl: null, documentUrl: url, documentName: fileName, inlineImages };
  }

  return { bodyWithoutAttachment: working, imageUrl: null, documentUrl: null, documentName: null, inlineImages };
}

function InlineImage({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={s.imageFallback}>
        <MaterialCommunityIcons name="image-broken-variant" size={18} color="#9ca3af" />
        <Text style={s.imageFallbackText}>Image couldn't be displayed</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: 180, height: 180, borderRadius: 12, marginTop: 4 }}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

function getImageAttachment(text: unknown): { bodyWithoutAttachment: string; imageUrl: string | null; documentUrl: string | null; documentName: string | null } {
  if (typeof text !== "string" || !text) {
    return { bodyWithoutAttachment: typeof text === "string" ? text : "", imageUrl: null, documentUrl: null, documentName: null };
  }

  const match = text.match(ATTACHMENT_LINE_REGEX);
  if (!match) return { bodyWithoutAttachment: text, imageUrl: null, documentUrl: null, documentName: null };

  const url = match[1] || match[2];
  if (!url) return { bodyWithoutAttachment: text, imageUrl: null, documentUrl: null, documentName: null };

  const bodyWithoutAttachment = text.slice(0, match.index).trim();
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const fileName = url.split("/").pop() ?? "Attachment";

  if (IMAGE_EXTENSIONS.includes(ext)) {
    return { bodyWithoutAttachment, imageUrl: url, documentUrl: null, documentName: null };
  }
  if (DOCUMENT_EXTENSIONS.includes(ext)) {
    return { bodyWithoutAttachment, imageUrl: null, documentUrl: url, documentName: fileName };
  }

  // Unknown extension — fall back to the original behavior, link stays in body
  return { bodyWithoutAttachment: text, imageUrl: null, documentUrl: null, documentName: null };
}

export default function ChatSupport({ navigation, route }: Props) {
  const { ticketId, departmentId } = route.params;
  const [attachmentDetails, setAttachmentDetails] = useState<ExpoAttachment | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
const { data: aiConfig } = useGetAiConfigQuery();

const [aiAutoReply] = useAiAutoReplyMutation();
const [markAiResolution] = useMarkAiResolutionMutation();
const [resolvedMap, setResolvedMap] = useState<Record<string, "resolved" | "unresolved">>({});

 const { data: aiState } = useGetAiStateQuery({ ticketId }, { skip: !ticketId });
const [aiDisabledLocally, setAiDisabledLocally] = useState(false);
const aiDisabledForTicket = aiState?.ai_enabled === false || aiDisabledLocally;


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
  const raw = getGiftedChatMessages(queryData.data.conversation, user, systemUser, aiConfig?.staff_id);
  return raw.map((m: any) => ({ ...m, _parsed: parseMessage(m.text) }));
}, [queryData, user, aiConfig?.staff_id]);

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
aiAutoReply({ ticketId, message: data.message }).unwrap().catch(() => {});
  } catch (e: any) {
    console.log("SEND ERROR:", JSON.stringify(e));  // ← add this
    showToast({ message: e?.data?.message ?? "Failed to send message. Please try again." });
  } finally {
    setIsSending(false);
  }
};

const handleResolution = async (messageId: string, resolved: boolean) => {
  setResolvedMap((prev) => ({ ...prev, [messageId]: resolved ? "resolved" : "unresolved" }));
  if (!resolved) {
    setAiDisabledLocally(true); // immediately hide buttons on every AI message, no more taps possible
  }
  try {
    await markAiResolution({ ticketId, resolved }).unwrap();
  } catch {
    showToast({ message: "Something went wrong. Please try again." });
  }
};

const handlePickImage = async () => {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    showToast({ message: "Photo library access is required to attach a photo." });
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });
 
  if (!result.canceled) {
    const asset = result.assets[0];
    const size = asset.fileSize ?? 0;
    if (size && findFileSize(size) > MAXIMUM_FILE_UPLOAD_SIZE) {
      showToast({ message: `File exceeds limit of ${formatBytes(MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES)}` });
      return;
    }
    onSelectAttachment({
      uri: asset.uri,
      name: asset.fileName ?? `photo_${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? "image/jpeg",
    } as ExpoAttachment);
  }
};

const handleAttachPress = () => {
  Alert.alert(
    "Attach",
    "Choose what you'd like to attach",
    [
      { text: "Photo", onPress: handlePickImage },
      { text: "Document", onPress: handleImagePress },
      { text: "Cancel", style: "cancel" },
    ],
    { cancelable: true }
  );
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
      renderMessageText={({ currentMessage, ...props }) => {
  const parsed: ParsedMessage = (currentMessage as any)._parsed ?? parseMessage(currentMessage.text);
  const { bodyWithoutAttachment, imageUrl, documentUrl, documentName, inlineImages } = parsed;
  const isAi = (currentMessage as any).isAiReply;
  const already = resolvedMap[String(currentMessage._id)];

  return (
    <View style={tw`mx-4 py-2`}>
      {inlineImages.map((uri, i) => (
        <InlineImage key={i} uri={uri} />
      ))}

      {!!bodyWithoutAttachment && (
        <RenderHTML
          source={{ html: bodyWithoutAttachment }}
          contentWidth={scale(width)}
          tagsStyles={{ p: tw`my-2`, a: { color: "#2563EB", textDecorationLine: "underline" } }}
          renderersProps={{ a: { onPress: (_event, href) => { Linking.openURL(href).catch(() => {}); } } }}
        />
      )}
      {imageUrl && (
        <TouchableOpacity onPress={() => Linking.openURL(imageUrl)} activeOpacity={0.85}>
          <InlineImage uri={imageUrl} />
        </TouchableOpacity>
      )}

      {documentUrl && (
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EEF3FF", borderRadius: 10, padding: 10, marginTop: 4, maxWidth: 240 }}
          onPress={() => Linking.openURL(documentUrl).catch(() => {})}
        >
          <MaterialCommunityIcons name="file-document-outline" size={20} color={BLUE} />
          <Text numberOfLines={1} style={{ fontSize: 12, color: BLUE, fontWeight: "600", flexShrink: 1 }}>
            {documentName}
          </Text>
        </TouchableOpacity>
      )}

      {isAi && !already && !aiDisabledForTicket && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#dcfce7" }} onPress={() => handleResolution(String(currentMessage._id), true)}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#16a34a" }}>Resolved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#fee2e2" }} onPress={() => handleResolution(String(currentMessage._id), false)}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#dc2626" }}>Unresolved</Text>
          </TouchableOpacity>
        </View>
      )}
      {isAi && (already || aiDisabledForTicket) && (
        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
          {already === "resolved" ? "Marked resolved ✓" : "An agent will respond to you shortly"}
        </Text>
      )}
    </View>
  );
}}

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
        <TouchableOpacity onPress={handleAttachPress} style={s.attachBtn}>
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
imageFallback: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f3f4f6", borderRadius: 10, padding: 10, marginTop: 4 },
imageFallbackText: { fontSize: 12, color: "#6b7280" },
});
