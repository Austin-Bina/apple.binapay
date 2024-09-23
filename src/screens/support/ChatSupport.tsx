import Screen from "@components/ui/shared/Screen";
import { systemUser } from "@constants/app";
import { SCREENS } from "@constants/screens";
import { getGiftedChatMessages } from "@helpers/chat-messages";
import tw from "@lib/tailwind";
import { SupportStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { useAddResponseMutation, useListConversationsQuery } from "@store/redux-api/supportApi";
import { selectUser } from "@store/selectors/auth";
import React, { useMemo, useState } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import { GiftedChat, IMessage, Send } from "react-native-gifted-chat";
import { ActivityIndicator, Appbar, Avatar, IconButton, Text } from "react-native-paper";
import GiftedChatComponents from "@components/screens/support-chat";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { ExpoAttachment } from "@type/app";
import * as FileSystem from "expo-file-system";
import { Colors } from "@constants/theme/colors";
import * as DocumentPicker from "expo-document-picker";
import { showToast } from "@helpers/toast";
import { MAXIMUM_FILE_UPLOAD_SIZE, MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES, formatBytes, findFileSize } from "@utils/file";
import AttachmentPreview from "@components/screens/support-chat/AttachmentPreview";
import { selectSupportDepartment } from "@store/selectors/support";
import RenderHTML from "react-native-render-html";
import { scale } from "react-native-size-matters";

type Props = SupportStackScreenProps<typeof SCREENS.SUPPORT_CHAT>;
export default function ChatSupport({ navigation, route }: Props) {
  const { ticketId, departmentId } = route.params;
  const [attachmentDetails, setAttachmentDetails] = useState<ExpoAttachment | null>(null);

  const { width } = useWindowDimensions();
  const user = useTypedSelector(selectUser);
  const department = useTypedSelector(selectSupportDepartment(departmentId));
  const [addTicketResponse] = useAddResponseMutation();
  const { data: queryData, isLoading } = useListConversationsQuery(
    {
      conversationId: ticketId,
    },
    {
      pollingInterval: 10000,
      skipPollingIfUnfocused: true,
      refetchOnMountOrArgChange: true,
      skip: !user || !ticketId,
    },
  );

  const messagesData = queryData?.data?.conversation ?? [];

  const inboxMessages = useMemo(() => {
    if (!user) {
      return [];
    }

    const formattedMessagesForGiftedChat = getGiftedChatMessages(messagesData, user, systemUser);

    return formattedMessagesForGiftedChat;
  }, [messagesData, user]);

  const onRemoveAttachment = () => {
    setAttachmentDetails(null);
  };
  const onSelectAttachment = (attachment: ExpoAttachment | null) => {
    if (!attachment) {
      onRemoveAttachment();
    } else {
      setAttachmentDetails(attachment);
    }
  };

  const onSendMessage = async (message: IMessage) => {
    let data = {
      ticketId: ticketId,
      message: message.text,
      attachment: "",
    };

    if (attachmentDetails) {
      const attachment = await FileSystem.readAsStringAsync(attachmentDetails.uri, {
        encoding: "base64",
      });

      data = {
        ...data,
        attachment,
      };

      onRemoveAttachment();
    }

    await addTicketResponse(data).unwrap();
  };

  const handleImagePress = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      const { size } = asset;
      const allowedSize = MAXIMUM_FILE_UPLOAD_SIZE;
      const allowedSizeInBytes = MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES;
      const formattedSize = formatBytes(size);

      if (size && findFileSize(size) <= allowedSize) {
        onSelectAttachment(asset);
      } else {
        showToast({
          message: `The file is ${formattedSize} which exceeds the allowed limit of ${formatBytes(allowedSizeInBytes)}`,
        });
      }
    }
  };

  return (
    <Screen style={tw.style(Platform.OS === "ios" && `pb-4`)}>
      <Appbar.Header style={tw`bg-white`}>
        <Appbar.BackAction onPress={navigation.goBack} color={Colors.gray[600]} />
        <View style={tw`w-full px-2 py-2 bg-white  flex flex-row gap-3 items-center `}>
          <View style={tw`flex flex-row items-center gap-3`}>
            <Avatar.Image size={40} style={tw`bg-white rounded-full`} source={require("@assets/icon.png")} />
            <View>
              <Text style={tw`text-zinc-700 text-lg font-medium leading-relaxed`}>BinaPay</Text>
              <Text style={tw`text-zinc-500 text-xs leading-relaxed`}>
                <Text style={tw`text-zinc-500 text-xs rounded-lg px-1`}>{department?.name} Team</Text>
              </Text>
            </View>
          </View>
        </View>
      </Appbar.Header>
      <GiftedChat
        messages={inboxMessages}
        user={{ _id: user?.id || 1, ...user }}
        alignTop={true}
        renderUsernameOnMessage={true}
        showUserAvatar={true}
        showAvatarForEveryMessage={false}
        renderAvatarOnTop={true}
        scrollToBottom={true}
        messagesContainerStyle={tw`bg-gray-100`}
        onSend={(message) => onSendMessage(message[0])}
        // renderDay={GiftedChatComponents.renderDay}
        renderBubble={GiftedChatComponents.renderBubble}
        renderAvatar={GiftedChatComponents.renderAvatar}
        renderLoading={() => <ActivityIndicator />}
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
        renderMessageText={({ currentMessage, ...props }) => {
          return (
            <View style={tw`mx-4 py-2`}>
              <RenderHTML
                source={{ html: currentMessage.text }}
                contentWidth={scale(width - 50)}
                tagsStyles={{
                  p: tw`text-white my-2`,
                }}
              />
            </View>
          );
        }}
      />

      <PleaseWaitModal visible={isLoading} />
    </Screen>
  );
}
