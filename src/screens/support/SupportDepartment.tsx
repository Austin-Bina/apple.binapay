import { SpeechBubbleCheck } from "@components/icons/svg";
import { ActionWithDescription, SupportAction } from "@components/screens/account";
import Banner from "@components/ui/banner";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import { SupportStackScreenProps } from "@navigators/types";
import { supportApi, useGetSupportDepartmentsQuery, useGetSupportHistoryQuery } from "@store/redux-api/supportApi";
import { formatSecondsToDate } from "@utils/index";
import { Fragment } from "react";
import { RefreshControl, View } from "react-native";
import { Badge, Button, Divider, Text } from "react-native-paper";
import { SupportStatus } from "@enum/support";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";

type Props = SupportStackScreenProps<typeof SCREENS.SUPPORT_DEPARTMENT>;
export default function SupportDepartment({ navigation }: Props) {
  const user = useTypedSelector(selectUser);
  const { data: queryData, isFetching, isError } = useGetSupportDepartmentsQuery();
  const { data: historyQuery, isError: isHistoryError } = useGetSupportHistoryQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 10000,
    skipPollingIfUnfocused: true,
    skip: !user,
  });

  const departments = queryData?.departments ?? [];
  const history = historyQuery?.data.tickets.filter((ticket) => ticket.status === SupportStatus.Open).slice(0, 5) ?? [];

  const handleNavigate = (departmentId: string) => {
    navigation.navigate(SCREENS.SUPPORT_START_CONVERSATION, { departmentId });
  };

  type HistoryArgs = {
    departmentId: string;
    ticketId: string;
  };
  const handleNavigateHistory = (args: HistoryArgs) => {
    navigation.navigate(SCREENS.SUPPORT_CHAT, { ...args });
  };

  const handleRefresh = () => {
    supportApi.util.prefetch("getSupportDepartments", undefined, { force: true });
    supportApi.util.prefetch("getSupportHistory", undefined, { force: true });
  };

  return (
    <Screen>
      <ScrollableView
        contentContainerStyle={tw`pt-5 justify-between`}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}>
        <View>
          <View style={tw`mb-4 px-4`}>
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Support Department</Text>
            <Text style={tw`w-full text-gray-500 text-base font-normal leading-snug mt-2`}>
              Contact our support team for any issues or queries. Our team is available 24/7 to assist you.
            </Text>
          </View>
          {!!isError && <Banner message="We had trouble loading support departments. Please try again." />}
          <View style={tw`mt-2`}>
            {departments.map((department, index) => (
              <Fragment key={department.id}>
                <SupportAction
                  title={department.name}
                  onPress={() => {
                    handleNavigate(department.id);
                  }}
                />
                {index !== departments.length - 1 && <Divider />}
              </Fragment>
            ))}
          </View>

          {/* Current open tickets */}
          <View style={tw`pt-5 pb-4 bg-white border border-gray-300 rounded-md mx-2 mt-10 min-h-[300px]`}>
            <Text style={tw`text-gray-500 text-xl font-bold leading-relaxed px-4 text-secondary`}>Open Issues</Text>
            {(history.length === 0 || isHistoryError) && (
              <Text style={tw`text-gray-500 text-sm font-bold leading-relaxed px-4`}>No open issues</Text>
            )}
            {history.map((ticket, index) => (
              <Fragment key={ticket.id}>
                <ActionWithDescription
                  title={ticket.subject}
                  description={`${formatSecondsToDate(ticket.last_update)}, ${ticket.department_name}: ${ticket.replies} replies`}
                  ItemIcon={SpeechBubbleCheck}
                  onPress={() => {
                    handleNavigateHistory({
                      ticketId: ticket.id,
                      departmentId: ticket.department_id,
                    });
                  }}
                />
                {index !== history.length - 1 && <Divider />}
              </Fragment>
            ))}
          </View>
          <View style={tw`px-5 pt-5 pb-10`}>
            <Button
              mode="text"
              onPress={() => {
                navigation.navigate(SCREENS.SUPPORT_HISTORY);
              }}>
              View More
            </Button>
          </View>
        </View>
      </ScrollableView>
      <PleaseWaitModal visible={isFetching} />
    </Screen>
  );
}
