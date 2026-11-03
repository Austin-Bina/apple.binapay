import { ChatOwner } from "@enum/support";
import { DraftMessage, GiftedChatMessageData } from "@type/app";
import { AddResponseBody, SupportChat, SystemUser } from "@type/support";
import { User } from "@type/user";
import type { IMessage } from "react-native-gifted-chat";

export function linkifyText(text: string): string {
  if (!text) return text;
  if (/<a\s/i.test(text)) return text; // already has real links, don't double-wrap

  const urlRegex = /(\bhttps?:\/\/[^\s<]+|\bwww\.[^\s<]+)/gi;

  return text.replace(urlRegex, (match) => {
    const href = match.startsWith("http") ? match : `https://${match}`;
    return `<a href="${href}">${match}</a>`;
  });
}

export function getGiftedChatMessages(
  messages: SupportChat[],
  currentUser: User,
  toUser: SystemUser,
  aiStaffId?: string,
): IMessage[] {
  if (!messages) {
    return [];
  }

  return messages.map((item) => {
    const { id, date, customer, message, clientStatuses, staff_id } = item as any;

    const msgCreatedAt = new Date(parseInt(date, 10) * 1000);
    const message_id = id;

    const isFromCurrentUser = customer === ChatOwner.Yes;
    const isAiReply = !isFromCurrentUser && !!aiStaffId && String(staff_id) === String(aiStaffId);

    const user = {
      _id: isFromCurrentUser ? currentUser.id : toUser.id,
      name: isFromCurrentUser ? currentUser.name : toUser.name,
      avatar: isFromCurrentUser ? currentUser.avatar : toUser.avatar,
    };

    const statuses = {
      sent: clientStatuses && typeof clientStatuses.sent === "boolean" ? clientStatuses.sent : true,
      received: clientStatuses && typeof clientStatuses.received === "boolean" ? clientStatuses.received : true,
      pending: clientStatuses && typeof clientStatuses.pending === "boolean" ? clientStatuses.pending : false,
    };

    return {
      _id: message_id,
      text: linkifyText(message),
      user,
      createdAt: msgCreatedAt,
      ...statuses,
      isAiReply, // custom field — not part of GiftedChat's IMessage type, but harmless; read via `currentMessage as any` on the receiving end
    };
  });
}

export const getUuid = () =>
  "xxxxxxxx4xxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const createPendingMessage = (data: AddResponseBody, patches?: Partial<SupportChat>): SupportChat => {
  const tempMessageId = patches?.id || getUuid();

  const { message = "", attachment = null } = data;
  let messageToShow = message;

  if (attachment) {
    messageToShow = `${message}\n\n[You sent an attachment with this message]`;
  }

  const pendingMessage = {
    id: tempMessageId,
    date: (Date.now() / 1000).toString(),
    customer: ChatOwner.Yes,
    staff_id: ChatOwner.No,
    message: messageToShow,
    clientStatuses: {
      received: false,
      sent: false,
      pending: true,
    },
    ...patches,
  };

  return pendingMessage;
};
