import { SupportHead } from "@components/icons/svg";
import { ActionWithDescription, SupportAction } from "@components/screens/account";
import Banner from "@components/ui/banner";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import tw from "@lib/tailwind";
import { SupportStackScreenProps } from "@navigators/types";
import {
  useGetSupportDepartmentsQuery,
  useGetSupportHistoryQuery,
  useSupportPrefetch,
} from "@store/redux-api/supportApi";
import { formatSecondsToDate } from "@utils/index";
import { Fragment, useEffect, useState } from "react";
import { RefreshControl, View } from "react-native";
import { Button, Divider, ProgressBar, Text } from "react-native-paper";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = SupportStackScreenProps<typeof SCREENS.SUPPORT_DEPARTMENT>;
export default function SupportDepartment({ navigation, route }: Props) {
  const [isSupportIdError, setIsSupportIdError] = useState(false);
  const [storedInitialMessage, setStoredInitialMessage] = useState<string>("");

  const user = useTypedSelector(selectUser);
  const { data: queryData, isFetching, isError } = useGetSupportDepartmentsQuery();
  const {
    data: historyQuery,
    error,
    isError: isHistoryError,
  } = useGetSupportHistoryQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 10000,
    skip: !user,
  });

  const prefetchDepartments = useSupportPrefetch("getSupportDepartments", {
    force: true,
  });

  const prefetchHistory = useSupportPrefetch("getSupportHistory", {
    force: true,
  });

  // Check if there's a stored message from a transaction reference
  useEffect(() => {
    const checkStoredMessage = async () => {
      try {
        const message = await AsyncStorage.getItem('SUPPORT_INITIAL_MESSAGE');
        if (message) {
          setStoredInitialMessage(message);
          // Clear the stored message so it doesn't show up again if user returns to this screen
          await AsyncStorage.removeItem('SUPPORT_INITIAL_MESSAGE');
        }
      } catch (err) {
        console.error("Error retrieving support message:", err);
      }
    };
    
    checkStoredMessage();
  }, []);

  // If is support error, stop retrying
  useEffect(() => {
    if (isSupportIdError) return;

    const err = error as any;
    const errorMessage = err?.data?.message || ("" as string | undefined);
    if (errorMessage?.includes("Support initialization required.")) {
      setIsSupportIdError(true);
    }
  }, [error]);

  const departments = queryData?.departments ?? [];
  const history = historyQuery?.data.tickets.slice(0, 5) ?? [];

  const handleNavigate = (departmentId: string) => {
    // Use the stored message from AsyncStorage if it exists, or the route params
    const initialMessage = storedInitialMessage || route.params?.initialMessage;
    navigation.navigate(SCREENS.SUPPORT_START_CONVERSATION, { 
      departmentId,
      initialMessage
    });
  };

  type HistoryArgs = {
    departmentId: string;
    ticketId: string;
  };
  const handleNavigateHistory = (args: HistoryArgs) => {
    navigation.navigate(SCREENS.SUPPORT_CHAT, { ...args });
  };

  const handleRefresh = () => {
    prefetchDepartments();
    prefetchHistory();
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
          {!!isError && <Banner content="We had trouble loading support departments. Please try again." />}
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
            <Text style={tw`text-gray-500 text-xl font-bold leading-relaxed px-4`}>Recent Issues</Text>
            {(history.length === 0 || isHistoryError) && !isFetching && (
              <Text style={tw`text-gray-500 text-sm font-bold leading-relaxed px-4`}>No recent issues</Text>
            )}
            {isFetching && (
              <View>
                <ProgressBar indeterminate />
              </View>
            )}
            {history.map((ticket, index) => (
              <Fragment key={ticket.id}>
                <ActionWithDescription
                  title={ticket.subject}
                  description={`${formatSecondsToDate(ticket.last_update)}, ${ticket.department_name}: ${ticket.replies} replies`}
                  ItemIcon={SupportHead}
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
    </Screen>
  );
}
