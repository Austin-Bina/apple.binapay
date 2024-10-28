import tw from "@lib/tailwind";
import { useTypedSelector } from "@store/common";
import { getNavigate } from "@utils/navigation";
import React, { memo } from "react";
import { TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Appbar, Text } from "react-native-paper";
import { selectUser } from "@store/selectors/auth";
import { AvatarImage } from "./avatar";
import { selectNotificationMeta } from "@store/selectors/notification";
import { HasNotification, NoNotification } from "./icons/svg";
import { s } from "react-native-size-matters";

export default memo(function UserAppbar() {
  const user = useTypedSelector(selectUser);
  const notificationInfo = useTypedSelector(selectNotificationMeta);
  const { width } = useWindowDimensions();

  const hasNotification = notificationInfo.unread_count > 0;
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
        <View style={tw.style(`flex flex-col items-start justify-start`, { width: s(width - 150) })}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={tw`text-gray-900 text-xl font-semibold`}>
            Hi, {user?.name} 👋🏽
          </Text>
          <Text style={tw`text-gray-500 text-sm font-medium leading-snug`}>Pay seamlessly with BinaPay!</Text>
        </View>
      </TouchableOpacity>
      <Appbar.Content title="" />
      <View style={tw`relative`}>
        <Appbar.Action
          icon={(props) => (hasNotification ? <HasNotification {...props} /> : <NoNotification {...props} />)}
          style={tw`bg-gray-100 rounded-xl justify-center items-center`}
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
          rippleColor="transparent"
        />
      </View>
    </Appbar.Header>
  );
});
