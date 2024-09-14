import { VerifiedBadge } from "@components/icons/svg";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import { NotificationStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { notificationSelector } from "@store/selectors/notifications";
import { formatDistanceToNow } from "date-fns";
import { View } from "react-native";
import { Badge, Text } from "react-native-paper";

type Props = NotificationStackScreenProps<"View Notification">;

export default function ViewNotificationScreen({ route }: Props) {
  const { id } = route.params;
  const notification = useTypedSelector((state) => notificationSelector.selectById(state, id));

  if (!notification) {
    return (
      <Screen>
        <View style={tw`flex-1 justify-center items-center`}>
          <Text style={tw`text-lg text-red-500`}>Notification not found.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4`}>
        <View style={tw`p-4`}>
          <Text style={tw`text-xl font-bold`}>{notification.data.title}</Text>
          <Text style={tw`text-sm text-gray-500`}>Type: {notification.type}</Text>
        </View>

        <View style={tw`p-4 bg-primary-100`}>
          <Text variant="bodyMedium" style={tw`text-gray-700`}>
            {notification.data.message}
          </Text>
        </View>

        <View style={tw`p-4 bg-primary-200 rounded-b-lg mb-4`}>
          <Text style={tw`text-lg font-bold mb-2 text-primary-700`}>Details:</Text>
          {Object.entries(notification.data.details).map(([key, value]) => (
            <View key={key} style={tw`flex-row justify-between mb-1`}>
              <Text variant="labelSmall" style={tw`text-gray-600`}>
                {key}:
              </Text>
              <Text variant="bodySmall" style={tw`text-gray-800 text-right w-9/12`}>
                {String(value)}
              </Text>
            </View>
          ))}
        </View>

        <View style={tw`p-4 bg-gray-50 rounded-lg mb-4`}>
          <Text variant="bodySmall" style={tw`text-xs text-gray-500`}>
            Sent {formatDistanceToNow(notification.created_at, { addSuffix: true })}
          </Text>
          <Badge
            visible={notification.read_at !== null}
            theme={{
              colors: {
                error: Colors.secondary.DEFAULT,
                onError: "white",
              },
            }}
            style={tw`absolute rounded-lg top-2 right-2`}
            size={20}>
            Notification Read
          </Badge>
        </View>
      </ScrollableView>
    </Screen>
  );
}
