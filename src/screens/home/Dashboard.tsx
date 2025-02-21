import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, TouchableOpacity, View } from "react-native";
import { Avatar, Button, Card, Divider, IconButton, Text } from "react-native-paper";
import { HomeStackScreenProps } from "@navigators/types";
import ScrollableView from "@components/ui/shared/ScrollableView";
import tw from "@lib/tailwind";
import IconButtonWithLabel from "@components/ui/button";
import PhoneIcon from "@assets/icons/phone.svg";
import WifiIcon from "@assets/icons/wifi.svg";
import ZapIcon from "@assets/icons/lightning.svg";
import MoreIcon from "@assets/icons/three-dots-horizontal.svg";
import ArrowRight from "@assets/icons/arrow-right.svg";
import UserAppbar from "@components/UserAppbar";
import { getNavigate } from "@utils/navigation";
import Banner from "@components/ui/banner";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { convertToNaira, formatToNaira } from "@utils/money";
import {
  selectHasFetchError,
  selectIsAccountVerified,
  selectIsFetchingProfile,
  selectUser,
} from "@store/selectors/auth";
import { accountTransactionsApi, useFetchRecentTransactionsQuery } from "@store/redux-api/accountTransactionsApi";
import { format } from "date-fns";
import { TransactionEmptyState } from "@components/ui/empty-states/transaction-list";
import TransactionLoader from "@components/ui/loaders/transaction-loader";
import * as Ably from "ably";
import { AccountUpdateEventPayload } from "@type/event";
import { authSliceActions } from "@store/slice/auth";
import API from "@lib/api";
import { route } from "@helpers/route";
import { navigateToTransaction } from "@helpers/transaction";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { useNotificationsPrefetch } from "@store/redux-api/notificationApi";
import { HorizontalDots, LargeEyeClose, LargeEyeOpen } from "@components/icons/svg";
import { scale } from "react-native-size-matters";
import { SCREENS } from "@constants/screens";
import FundAccountSheet from "@components/ui/modals/fund-account";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { getTransactionIcon } from "@utils/index";
import { MAX_CACHE_AGE_SEC } from "@constants/app";

type Props = HomeStackScreenProps<typeof SCREENS.DASHBOARD>;
export default function HomeScreen({ navigation }: Props) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [fundModalVisible, setFundModalVisible] = useState(false);

  const isFetchingProfile = useTypedSelector(selectIsFetchingProfile);
  const hasProfileError = useTypedSelector(selectHasFetchError);

  const user = useTypedSelector(selectUser);
  const isVerified = useTypedSelector(selectIsAccountVerified);
  const toggleBalance = () => setBalanceVisible(!balanceVisible);
  const dispatch = useTypedDispatch();

  const prefetchSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });

  const prefetchNotifications = useNotificationsPrefetch("fetchNotifications", {
    ifOlderThan: 5,
  });

  const balanceNaira = useMemo(() => formatToNaira(user?.wallet_balance), [user?.wallet_balance]);
  const [integerSide, decimalSide] = balanceNaira.split(".");

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([initProfile(), initCable()]);
  }, []);

  const initProfile = useCallback(async () => {
    await dispatch(authSliceActions.fetchUserProfile());

    prefetchNotifications({ page: 1 });
    prefetchSettings();
  }, [dispatch]);

  const initCable = useCallback(() => {
    if (!user?.id) return;

    const client = new Ably.Realtime({
      authCallback: async (tokenParams, callback) => {
        let tokenRequest: Ably.TokenRequest;

        try {
          const response = await API.get(route("auth.getAblyToken"), {
            params: tokenParams,
          });
          const { token } = response.data;

          tokenRequest = token;
        } catch (err: any) {
          callback(err, null);

          if (err.response?.status === 401) {
            dispatch(authSliceActions.logout());
          }
          return;
        }

        callback(null, tokenRequest);
      },
      authParams: { client: "mobile" },
    });

    const channel = client.channels.get(`private:user-updates.${user.id}`);

    channel
      .attach()
      .then(() => {
        channel.subscribe((message: Ably.Message) => {
          const { name, data } = message;

          if (name === "account.updated") {
            const { payload } = data as AccountUpdateEventPayload;
            const { refreshFlags, account } = payload;

            if (account?.user) {
              dispatch(authSliceActions.updateUser({ ...account.user }));
            }

            if (refreshFlags?.transactions) {
              dispatch(accountTransactionsApi.util.invalidateTags(["Transactions Summary"]));
            }
          }
        });
      })
      .catch((error) => console.log("Ably Caught error: ", error));
  }, [user?.id]);

  const onRefresh = async () => {
    if (!isFetchingProfile) {
      await Promise.all([initProfile()]);
    }
  };

  const handleVerifyAccount = async () => {
    const { navigate } = await getNavigate();
    navigate(SCREENS.MAIN, {
      screen: SCREENS.MENU,
      params: {
        screen: SCREENS.VERIFY_ACCOUNT,
        params: {
          screen: SCREENS.ACCOUNT_VERIFICATION_OPTIONS,
        },
      },
    });
  };

  const openFundModal = () => {
    setFundModalVisible(true);
  };

  const closeFundModal = () => {
    setFundModalVisible(false);
  };

  const handleFundWithBank = () => {
    closeFundModal();

    navigation.navigate(SCREENS.ADD_MONEY, {
      screen: SCREENS.FUND_WITH_BANK,
    });
  };

  const handleFundWithCard = () => {
    closeFundModal();

    navigation.navigate(SCREENS.ADD_MONEY, {
      screen: SCREENS.FUND_WITH_CARD,
    });
  };

  const handleManualFund = () => {
    closeFundModal();

    navigation.navigate(SCREENS.ADD_MONEY, {
      screen: SCREENS.MANUAL_FUND_STACK,
      params: { screen: SCREENS.START_MANUAL_FUNDING },
    });
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <UserAppbar />
      <ScrollableView
        style={tw`px-3 flex flex-1 py-6`}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}>
        {/* Balance */}
        <Card mode="contained" style={tw`bg-primary-50 py-2`}>
          <Card.Content style={tw`items-center`}>
            <View style={tw`flex-row justify-center items-center`}>
              <View>
                {balanceVisible ? (
                  <View style={tw`flex-row items-baseline`}>
                    <Text style={tw`text-gray-900 font-bold text-3xl`}>{integerSide}.</Text>
                    <Text style={tw`text-gray-900 font-bold text-xl`}>{decimalSide || "00"}</Text>
                  </View>
                ) : (
                  <HorizontalDots />
                )}
              </View>
              <IconButton
                icon={
                  balanceVisible
                    ? (props) => <LargeEyeOpen {...props} width={scale(30)} height={scale(30)} />
                    : (props) => <LargeEyeClose {...props} width={scale(30)} height={scale(30)} />
                }
                onPress={toggleBalance}
              />
            </View>
            <Text style={tw`text-center text-sm text-gray-400`}>Current Balance</Text>
            <Button icon="wallet" mode="outlined" style={tw`border-primary mt-2`} onPress={openFundModal}>
              Fund Wallet
            </Button>
          </Card.Content>
        </Card>

        {hasProfileError && (
          <Pressable onPress={onRefresh} style={tw`mt-6`}>
            <Banner
              title="Network Error"
              content="We couldn't load some of your account details. Click to try again."
            />
          </Pressable>
        )}

        {!isVerified && (
          <Pressable onPress={handleVerifyAccount} style={tw`mt-6`}>
            <Banner
              title="Account Verification"
              content="You are yet to verify your account, you will not be able to access some services on BinaPay. Click to complete verification now."
            />
          </Pressable>
        )}

        <View style={tw`my-4`}>
          <Text style={tw`text-base font-medium text-gray-600 mb-3.5`}>Services</Text>
          <View style={tw`flex-row justify-around`}>
            <IconButtonWithLabel
              RenderIcon={PhoneIcon}
              size={24}
              label="Airtime+Purchase"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "Airtime Purchase",
                  },
                });
              }}
            />
            <IconButtonWithLabel
              RenderIcon={WifiIcon}
              size={24}
              label="Data+Bundle"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "Data Purchase",
                  },
                });
              }}
            />
            <IconButtonWithLabel
              RenderIcon={ZapIcon}
              size={24}
              label="Electricity"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "Electricity Bill",
                  },
                });
              }}
            />
            <IconButtonWithLabel
              RenderIcon={MoreIcon}
              size={24}
              label="Explore+More"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "List",
                  },
                });
              }}
            />
          </View>
        </View>
        {/* Recent Transactions */}
        <RecentTransactions navigation={navigation} />
      </ScrollableView>
      <FundAccountSheet
        show={fundModalVisible}
        hide={closeFundModal}
        navigation={{
          handleFundWithBank,
          handleFundWithCard,
          handleManualFund,
        }}
      />
    </View>
  );
}

type RecentTransactionsProps = {
  navigation: any;
};

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ navigation }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: queryData, isLoading } = useFetchRecentTransactionsQuery(undefined, {
    refetchOnFocus: true,
  });

  const { transactions = {} } = queryData || {};

  const onTransactionPress = async (transactionId: string | number) => {
    navigateToTransaction({
      transactionId: transactionId,
      onStart: () => {
        setIsProcessing(true);
      },
      onFinish: (result) => {
        setIsProcessing(false);
      },
    });
  };

  const dynamicContent = useMemo(() => {
    if (isLoading) {
      return <TransactionLoader groups={["Today"]} />;
    }

    if (!transactions || Object.entries(transactions).length === 0) {
      return <TransactionEmptyState />;
    }

    return Object.entries(transactions).map(([group, transactions]) => (
      <View key={group}>
        <Text variant="titleMedium" style={tw`text-gray-900`}>
          {group}
        </Text>

        <View>
          {transactions.map((transaction, index) => (
            <Fragment key={transaction.id}>
              <TouchableOpacity
                key={transaction.id}
                onPress={() => onTransactionPress(transaction.id)}
                style={tw`flex-row items-center justify-between gap-2 p-2 my-2`}>
                <Fragment>
                  <Avatar.Image
                    size={40}
                    source={{
                      uri: getTransactionIcon(transaction),
                    }}
                    style={tw`bg-transparent`}
                  />
                  <View style={tw`flex-1 mx-3`}>
                    <Text style={tw`text-gray-900 text-sm`}>{transaction.meta.description}</Text>
                    <Text style={tw`text-gray-500 text-xs`}>
                      {format(transaction.created_at, "MMM dd, yyyy h:mm a")}
                    </Text>
                  </View>
                  <Text style={tw`text-gray-900 font-semibold`}>{convertToNaira(transaction.amount, true)}</Text>
                </Fragment>
              </TouchableOpacity>
              {index !== transactions.length - 1 && <Divider />}
            </Fragment>
          ))}
        </View>
        <PleaseWaitModal visible={isProcessing} />
      </View>
    ));
  }, [transactions, isLoading, isProcessing]);

  return (
    <View style={tw`mt-4 mb-20`}>
      <View style={tw`flex-row justify-between items-center mb-5`}>
        <Text style={tw`text-base font-medium text-gray-600`}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Transaction History")}>
          <View style={tw`flex-row items-center gap-1`}>
            <Text style={tw`text-primary text-xs`}>See More</Text>
            <ArrowRight width={20} />
          </View>
        </TouchableOpacity>
      </View>
      {dynamicContent}
    </View>
  );
};
