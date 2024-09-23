import { ActionWithDescription } from "@components/screens/account";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { Colors } from "@constants/theme/colors";
import tw from "@lib/tailwind";
import { SupportStackScreenProps } from "@navigators/types";
import { useGetSupportHistoryQuery } from "@store/redux-api/supportApi";
import { formatSecondsToDate } from "@utils/index";
import { Fragment } from "react";
import { View } from "react-native";
import { Badge, Divider, Text } from "react-native-paper";

type Props = SupportStackScreenProps<typeof SCREENS.SUPPORT_HISTORY>;
export default function SupportHistory({ navigation }: Props) {
  const { data: historyQuery, isError: isHistoryError } = useGetSupportHistoryQuery();

  const history = historyQuery?.data.tickets ?? [];

  type HistoryArgs = {
    departmentId: string;
    ticketId: string;
  };

  const handleNavigateHistory = (args: HistoryArgs) => {
    navigation.navigate(SCREENS.SUPPORT_CHAT, { ...args });
  };

  return (
    <Screen>
      <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold px-4 mt-5`}>
        Support History
      </Text>
      <ScrollableView contentContainerStyle={tw`pt-5 justify-between`}>
        {isHistoryError && (
          <Text variant="bodySmall" style={tw`text-gray-500 px-4`}>
            We had trouble loading support history.
          </Text>
        )}
        <View style={tw`flex-1`}>
          {history.map((ticket, index) => (
            <Fragment key={ticket.id}>
              <ActionWithDescription
                title={ticket.subject}
                description={`${formatSecondsToDate(ticket.last_update)}, ${ticket.department_name}`}
                onPress={() => {
                  handleNavigateHistory({
                    ticketId: ticket.id,
                    departmentId: ticket.department_id,
                  });
                }}
                badgeElement={
                  <Badge
                    theme={{
                      colors: {
                        error: Colors.secondary[600],
                        onError: "white",
                      },
                    }}>
                    {`${ticket.replies} replies`}
                  </Badge>
                }
              />
              {index !== history.length - 1 && <Divider />}
            </Fragment>
          ))}
        </View>
      </ScrollableView>
    </Screen>
  );
}
