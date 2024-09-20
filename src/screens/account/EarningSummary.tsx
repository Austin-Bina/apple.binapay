import { AvatarImage } from "@components/avatar";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import CopyReferralCode from "@components/ui/widgets/CopyReferralCode";
import tw from "@lib/tailwind";
import { AccountStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { useGetReferralRewardsQuery } from "@store/redux-api/referralQueryApi";
import { selectUser } from "@store/selectors/auth";
import { formatToNaira } from "@utils/money";
import React, { useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";

type Props = AccountStackScreenProps<"Earning Summary">;

export default function EarningSummaryScreen({}: Props) {
  const [page, setPage] = useState(1);

  const user = useTypedSelector(selectUser);
  const { data: queryData, error, isFetching, refetch } = useGetReferralRewardsQuery({ page, per_page: 10 });

  const summary = useMemo(() => {
    if (!queryData) {
      return {
        data: [],
        meta: {
          has_more: false,
          total_earnings: 0,
        },
      };
    }

    return queryData;
  }, [queryData]);

  const loadMore = () => {
    if (!isFetching && summary.meta.has_more) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const renderErrorScreen = () => (
    <View style={tw`flex-1 items-center justify-center p-4`}>
      <Text style={{ color: "red", textAlign: "center", fontSize: 16 }}>
        Oops! We could't fetch some of your data, Please try again later.
      </Text>
    </View>
  );

  return (
    <Screen>
      <ScrollableView refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />} style={tw`px-4 pt-5`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          View Your Earnings
        </Text>
        {!!error && !isFetching && renderErrorScreen()}
        <Card mode="contained" style={tw`bg-primary-50 py-2 my-8`}>
          <Card.Content style={tw`items-center`}>
            <Text style={tw`text-gray-900 font-bold text-xl text-center mb-1`}>
              {formatToNaira(summary.meta.total_earnings)}
            </Text>
            <Text style={tw`text-center text-gray-600`}>Total Earnings</Text>
          </Card.Content>
        </Card>
        {user?.affiliate_id && <CopyReferralCode referralCode={user.affiliate_id} />}
        <View>
          <Text variant="titleMedium" style={tw`text-gray-800 mb-5`}>
            Earnings Summary
          </Text>
          {summary.data.length === 0 && (
            <View style={tw`flex-1 items-center justify-center p-4`}>
              <Text style={{ textAlign: "center", fontSize: 16 }}>No earnings available at the moment.</Text>
            </View>
          )}
          {summary.data.map((item) => (
            <View
              key={item.id}
              style={tw`my-1.5 px-2 py-1 rounded-2xl border border-gray-100 flex-row justify-between items-center`}>
              <View style={tw`flex-row items-center gap-2`}>
                <AvatarImage avatar={item.referee.avatar} size={48} />
                <Text variant="titleSmall" style={tw`font-bold text-gray-900`}>
                  {item.referee.name}
                </Text>
              </View>
              <Chip icon="" mode="flat" style={tw`bg-green-50`} textStyle={tw`text-green-600`}>
                {formatToNaira(item.reward_amount)}
              </Chip>
            </View>
          ))}
        </View>
      </ScrollableView>
    </Screen>
  );
}
