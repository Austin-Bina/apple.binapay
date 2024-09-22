import { StyleSheet } from "react-native";
import React from "react";
import { AvatarProps, Bubble, BubbleProps, Day, DayProps, IMessage } from "react-native-gifted-chat";
import { format } from "date-fns";
import { Icon, Text } from "react-native-paper";
import tw from "@lib/tailwind";
import { AvatarImage } from "@components/avatar";

const renderDay = (props: DayProps) => {
  return (
    <Day
      {...props}
      wrapperStyle={{
        backgroundColor: "#B6DEDE",
        borderRadius: 999,
        paddingHorizontal: 20,
        paddingVertical: 9,
      }}
      textStyle={styles.textStyles}
    />
  );
};

const renderBubble = ({ currentMessage, position, ...rest }: BubbleProps<IMessage & { read: boolean }>) => {
  const decodedCurrentMessage: any = {
    ...currentMessage,
    text: currentMessage?.text,
  };

  const renderTime = () => {
    return <Text style={styles.messageTime}>{format(currentMessage?.createdAt || Date.now(), "hh:mm a")}</Text>;
  };

  const renderMessageSentIcon = () => {
    let iconName: any = "check";
    let iconColor = styles.textStyles.color;

    if (currentMessage?.received) {
      iconName = "check-all";
      iconColor = "gray";
    }

    if (position === "right") {
      return <Icon source={iconName} color={iconColor} size={14} />;
    }

    return null;
  };

  return (
    <Bubble
      {...{
        currentMessage: decodedCurrentMessage,
        position,
        renderTicks: renderMessageSentIcon,
        bottomContainerStyle: {
          right: styles.bottomContainerStyle,
          left: styles.bottomContainerStyle,
        },
        wrapperStyle: {
          left: {
            backgroundColor: "#e0f2ff",
          },
          right: {
            backgroundColor: "#CADFD0",
          },
        },
        textStyle: {
          left: styles.messageText,
          right: styles.messageText,
        },
        renderTime,
        containerToPreviousStyle: {
          left: tw`-ml-4`,
        },
        ...rest,
      }}
    />
  );
};

const renderAvatar = ({ currentMessage }: AvatarProps<IMessage>) => {
  return currentMessage?.user?.avatar ? (
    <AvatarImage avatar={currentMessage.user.avatar} style={tw.style("bg-transparent")} size={20} />
  ) : null;
};

export default {
  renderDay,
  renderBubble,
  renderAvatar,
};

const styles = StyleSheet.create({
  textStyles: {
    color: "#191919",
    fontSize: 13,
    fontWeight: "500",
  },
  bottomContainerStyle: { paddingHorizontal: 10, paddingBottom: 5 },
  messageInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#555",
  },
  messageTime: {
    fontSize: 11,
    color: "#191919",
  },
  messageTextContainer: {
    marginTop: 5,
  },
  messageText: {
    fontSize: 16,
    color: "#191919",
    fontWeight: "400",
  },
});
