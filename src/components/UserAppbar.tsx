import tw from "@lib/tailwind";
import { useTypedSelector } from "@store/common";
import { getNavigate } from "@utils/navigation";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Appbar, Avatar, Badge, Text } from "react-native-paper";
import { selectUser } from "@store/selectors/auth";
import { selectUnreadCount } from "@store/selectors/notifications";
import { Colors } from "@constants/theme";

export default function UserAppbar() {
  const user = useTypedSelector(selectUser);
  const unreadCount = useTypedSelector(selectUnreadCount);

  return (
    <Appbar.Header style={tw`bg-white`}>
      <TouchableOpacity
        onPress={async () => {
          const { navigate } = await getNavigate();
          navigate("Main", {
            screen: "Menu",
            params: {
              screen: "Settings",
            },
          });
        }}
        style={tw`flex flex-row gap-3 mx-2`}>
        <View style={tw`flex flex-col items-center justify-center rounded-full border border-emerald-100`}>
          <Avatar.Image
            size={48}
            style={tw`rounded-full bg-gray-200`}
            source={require("@assets/draft/male-avatar-circle.png")}
          />
          {/* <AvatarImage avatar={} /> */}
        </View>
        <View style={tw`flex flex-col items-start justify-start`}>
          <Text style={tw`text-zinc-500 text-sm font-normal`}>Hi, {user?.name} 👋🏽</Text>
          <Text style={tw`text-zinc-800 text-lg font-medium leading-snug`}>Pay seamlessly with BinaPay!</Text>
        </View>
      </TouchableOpacity>
      <Appbar.Content title="" />
      <View style={tw`relative`}>
        <Appbar.Action
          icon="bell"
          size={30}
          onPress={async () => {
            const { navigate } = await getNavigate();
            navigate("Main", {
              screen: "Home",
              params: {
                screen: "Notification",
                params: {
                  screen: "List Notifications",
                },
              },
            });
          }}
        />
        <Badge
          style={tw`absolute top-2 right-2`}
          theme={{
            colors: {
              error: Colors.primary.DEFAULT,
              onError: "white",
            },
          }}
          size={18}
          visible={unreadCount > 0}>
          {unreadCount}
        </Badge>
      </View>
    </Appbar.Header>
  );
}
