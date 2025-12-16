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
import { Card, Chip, Text, Button } from "react-native-paper";
import DefaultAvatar from "@assets/draft/male-avatar-circle.png";
import { useNavigation } from "@react-navigation/native";

type Props = AccountStackScreenProps<"Earning Summary">;

export default function EarningSummaryScreen({}: Props) {
  const [page, setPage] = useState(1);

  const user = useTypedSelector(selectUser);
  const { data: queryData, error, isFetching, refetch } =
    useGetReferralRewardsQuery({ page, per_page: 10 });
  const navigation =
    useNavigation<AccountStackScreenProps<"Earning Summary">["navigation"]>();

  const summary = useMemo(() => {
    if (!queryData) {
      return {
        data: [],
        meta: {
          has_more: false,
          total_earnings: 0,
          total_volume: 0,
          total_trading_volume: 0,
        },
      };
    }
    return queryData;
  }, [queryData]);

  const renderErrorScreen = () => (
    <View style={tw`flex-1 items-center justify-center p-4`}>
      <Text style={{ color: "red", textAlign: "center", fontSize: 16 }}>
        Oops! We couldn't fetch your data. Please try again later.
      </Text>
    </View>
  );

  return (
    <Screen>
      <ScrollableView
        style={tw`px-4 pt-5`}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
      >
        <Text variant="titleLarge" style={tw`text-gray-900 font-bold mb-3`}>
          Earnings Overview
        </Text>

        {!!error && !isFetching && renderErrorScreen()}

        {/* TOTAL EARNINGS CARD */}
        <Card
          mode="contained"
          style={tw`bg-primary-50 p-4 rounded-2xl shadow-sm mb-5`}
        >
          <Card.Content style={tw`items-center`}>
            <Text style={tw`text-gray-900 font-bold text-2xl mb-1`}>
              {formatToNaira(summary.meta.total_earnings)}
            </Text>
            <Text style={tw`text-gray-600 mb-4 text-sm`}>
              Total Referral Earnings
            </Text>

            <Text style={tw`text-gray-900 font-bold text-xl`}>
              {formatToNaira(summary.meta.total_volume)}
            </Text>
            <Text style={tw`text-gray-600 mb-6 text-sm`}>
              Total Referral Trading Volume
            </Text>

            {/* LEADERBOARD BUTTON */}
            <Button
              mode="contained"
              onPress={() =>
                navigation.navigate("Leaderboard", { filter: "weekly" })
              }
              style={tw`rounded-full bg-primary-600 w-full py-1.5`}
              labelStyle={tw`text-white font-semibold`}
            >
              View Leaderboard
            </Button>
          </Card.Content>
        </Card>

        {/* REFERRAL CODE */}
        {user?.affiliate_id && (
          <CopyReferralCode referralCode={user.affiliate_id} />
        )}

        <Text variant="titleMedium" style={tw`text-gray-800 mt-6 mb-3`}>
          Earnings Summary
        </Text>

        {/* EMPTY STATE */}
        {summary.data.length === 0 && (
          <View style={tw`items-center justify-center p-4`}>
            <Text style={{ textAlign: "center", fontSize: 16 }}>
              No earnings available at the moment.
            </Text>
          </View>
        )}

        {/* LIST OF REFEREES */}
        {summary.data.map((item) => (
          <View
            key={item.id}
            style={tw`flex-row items-center justify-between bg-white p-3 my-1.5 rounded-2xl border border-gray-100 shadow-sm`}
          >
            <View style={tw`flex-row items-center gap-3 flex-1`}>
              <AvatarImage
                avatar={item.referee?.avatar ?? DefaultAvatar}
                size={46}
              />
              <View style={tw`flex-1`}>
                <Text
                  variant="titleSmall"
                  numberOfLines={1}
                  style={tw`font-bold text-gray-900`}
                >
                  {item.referee?.name ?? "Unknown User"}
                </Text>
                <Text style={tw`text-gray-600 text-sm`}>
                  Volume: {formatToNaira(item.total_trading_volume)}
                </Text>
              </View>
            </View>

            <Chip
              mode="flat"
              style={tw`bg-green-50`}
              textStyle={tw`text-green-600 font-semibold`}
            >
              {formatToNaira(item.total_reward_earned)}
            </Chip>
          </View>
        ))}
      </ScrollableView>
    </Screen>
  );
}

/*
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
import { Card, Chip, Text, Button } from "react-native-paper";
import DefaultAvatar from '@assets/draft/male-avatar-circle.png';
import { useNavigation } from "@react-navigation/native";

type Props = AccountStackScreenProps<"Earning Summary">;

export default function EarningSummaryScreen({}: Props) {
  const [page, setPage] = useState(1);

  const user = useTypedSelector(selectUser);
  const { data: queryData, error, isFetching, refetch } = useGetReferralRewardsQuery({ page, per_page: 10 });
const navigation = useNavigation<AccountStackScreenProps<"Earning Summary">["navigation"]>();

  const summary = useMemo(() => {
    if (!queryData) {
      return {
        data: [],
        meta: {
          has_more: false,
          total_earnings: 0,
          total_volume: 0,
          total_trading_volume: 0,
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

        {/* Total Earnings Card *
        <Card mode="contained" style={tw`bg-primary-50 py-2 my-4`}>
          <Card.Content style={tw`items-center`}>
            <Text style={tw`text-gray-900 font-bold text-xl text-center mb-1`}>
              {formatToNaira(summary.meta.total_earnings)}
            </Text>
            <Text style={tw`text-center text-gray-600`}>Total Earnings</Text>

            {/* Total Referral Trading Volume *//*
            <Text style={tw`text-gray-800 font-bold text-lg mt-4`}>
              {formatToNaira(summary.meta.total_volume)}
            </Text>
            <Text style={tw`text-gray-600 text-center`}>Your Referral Trading Volume</Text>
          </Card.Content>
        </Card>

<Card mode="contained" style={tw`bg-blue-100 py-2 my-4`}>
  <Card.Content style={tw`items-center`}>
    <Text style={tw`text-blue-800 font-bold text-lg mb-1`}>
      See Full Leaderboard
    </Text>
    <Button
      mode="contained"
      onPress={() => navigation.navigate("Leaderboard", { filter: "weekly" })}
      style={tw`bg-blue-700 rounded-full mt-2`}
      labelStyle={tw`text-white font-bold`}
    >
      View Leaderboard
    </Button>
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
       
          {/* Individual Referee List 
          {summary.data.map((item) => (
            <View
              key={item.id}
              style={tw`my-1.5 px-2 py-1 rounded-2xl border border-gray-100 flex-row justify-between items-center`}
            >
              <View style={tw`flex-row items-center gap-2 flex-1`}>
                <AvatarImage avatar={item.referee?.avatar ?? DefaultAvatar} size={48} />
                <View style={tw`flex-1`}>
                  <Text
                    variant="titleSmall"
                    style={tw`font-bold text-gray-900`}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.referee?.name ?? "Unknown Referee"}
                  </Text>
                  <Text style={tw`text-gray-600 text-sm`}>
                    Volume: {formatToNaira(item.total_trading_volume)}
                  </Text>
                </View>
              </View>

              <Chip icon="" mode="flat" style={tw`bg-green-50`} textStyle={tw`text-green-600`}>
                {formatToNaira(item.total_reward_earned)}
              </Chip>
            </View>
          ))}
        </View>
      </ScrollableView>
    </Screen>
  );
}
*/
