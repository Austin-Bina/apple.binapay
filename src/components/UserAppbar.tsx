import tw from "@lib/tailwind";
import { useTypedSelector } from "@store/common";
import { getNavigate } from "@utils/navigation";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Appbar, Badge, Text } from "react-native-paper";
import { selectUser } from "@store/selectors/auth";
import { selectUnreadCount } from "@store/selectors/notifications";
import { Colors } from "@constants/theme";
import { AvatarImage } from "./avatar";

export default function UserAppbar() {
  const user = useTypedSelector(selectUser);
  const unreadCount = useTypedSelector(selectUnreadCount);

  return (
    <Appbar.Header style={tw`bg-white py-2 mt-2`}>
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
          <AvatarImage avatar={user?.avatar} size={48} svgProps={{ width: 48, height: 48 }} />
        </View>
        <View style={tw`flex flex-col items-start justify-start`}>
          <Text style={tw`text-zinc-500 text-sm font-normal`}>Hi, {user?.name} 👋🏽</Text>
          <Text style={tw`text-zinc-800 text-base font-medium leading-snug`}>Pay seamlessly with BinaPay!</Text>
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
