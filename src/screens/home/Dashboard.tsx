import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, TouchableOpacity, View } from "react-native";
import { Avatar, Button, Card, Divider, IconButton, Text } from "react-native-paper";
import { HomeStackScreenProps } from "@navigators/types";
import { FlatList } from "react-native";
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
import { navigateToTransaction, getTransactionStatus } from "@helpers/transaction";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { useNotificationsPrefetch } from "@store/redux-api/notificationApi";
import { HorizontalDots, LargeEyeClose, LargeEyeOpen } from "@components/icons/svg";
import { scale } from "react-native-size-matters";
import { SCREENS } from "@constants/screens";
import FundAccountSheet from "@components/ui/modals/fund-account";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { getTransactionIcon } from "@utils/index";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import StatusBadge from "@components/ui/transaction/StatusBadge";
import CryptoOverview from "./CryptoOverview";
import WithdrawFundsSheet from "../../components/ui/modals/withdraw-funds";
import ContactSupportButton from "@components/ui/ContactSupportButton";
import { CryptoProvider } from "./CryptoContext";
import { formatTransactionAmount } from "../../utils/transactionutils";
import { formattedBalance } from "../../utils/transactionutils";
import { useCrypto } from "./CryptoContext";

type Props = HomeStackScreenProps<typeof SCREENS.DASHBOARD>;
export default function HomeScreen({ navigation }: Props) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [fundModalVisible, setFundModalVisible] = useState(false);
const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const isFetchingProfile = useTypedSelector(selectIsFetchingProfile);
  const hasProfileError = useTypedSelector(selectHasFetchError);
  /*
const nairaBalance = useTypedSelector(selectNairaBalance); //naira balance selector
const usdBalance = useTypedSelector(selectUsdBalance); //usd balance selector
*/
const [activeTab, setActiveTab] = useState<"wallets" | "transactions">("wallets"); // for wallets and transactions table

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

  /*
  // naira wallet balance

  const balanceNaira = useMemo(() => formatToNaira(user?.wallet_balance), [user?.wallet_balance]);
  const [integerSide, decimalSide] = balanceNaira.split(".");
*/

const nairaWalletBalance = user?.wallet_balances?.naira?.balance ?? "0";
const balanceNaira = useMemo(() => formatToNaira(nairaWalletBalance), [nairaWalletBalance]);
const [integerSide, decimalSide] = balanceNaira.split(".");
const cryptoUsdBalance = user?.wallet_balances?.crypto_usd?.balance ?? 0;




  const initProfile = useCallback(async () => {
  await dispatch(authSliceActions.fetchUserProfile());
  prefetchNotifications({ page: 1 });
  prefetchSettings();
}, [dispatch]);


const initCable = useCallback(() => {
  if (!user?.id) return;

  const client = new Ably.Realtime({
    authCallback: async (tokenParams, callback) => {
      try {
        const response = await API.get(route("auth.getAblyToken"), { params: tokenParams });
        callback(null, response.data.token);
      } catch (err: any) {
        callback(err, null);
        if (err.response?.status === 401) dispatch(authSliceActions.logout());
      }
    },
    authParams: { client: "mobile" },
  });

  const channel = client.channels.get(`private:user-updates.${user.id}`);

  channel.attach().then(() => {
    channel.subscribe((message: Ably.Message) => {
      const { name, data } = message;

      if (name === "account.updated") {
        const { payload } = data as AccountUpdateEventPayload;
        if (payload.account?.user) dispatch(authSliceActions.updateUser(payload.account.user));
        if (payload.refreshFlags?.transactions) {
          dispatch(accountTransactionsApi.util.invalidateTags(["Transactions Summary"]));
        }
      }
    });
  }).catch(console.log);
}, [user?.id]);

  /*
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
*/


useEffect(() => {
  if (!user?.id) return;

  const initialize = async () => {
    // Run profile and dashboard fetches in parallel
await initProfile();
    // Then initialize Ably after profile/dashboard are ready
    initCable();
  };

  initialize();
}, [user?.id, initProfile, initCable]);


const onRefresh = async () => {
  try {
    // Avoid triggering multiple refreshes at the same time
    if (isFetchingProfile) return;

   

    // Refresh user profile & prefetch data
    await initProfile();
  } catch (err) {
    console.log("Refresh error:", err);
  }
};


/*
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
*/

const handleVerifyAccount = async () => {
  const { navigate } = await getNavigate();

  navigate(SCREENS.MAIN, {
    screen: SCREENS.MENU,
    params: {
      screen: SCREENS.VERIFY_ACCOUNT,
      params: {
        screen: SCREENS.PHONE_VERIFICATION,      },
      
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

  const handleFundWithPaystack = () => {
    closeFundModal();

    navigation.navigate(SCREENS.ADD_MONEY, {
      screen: SCREENS.FUND_WITH_PAYSTACK,
    });
  };

  const handleManualFund = () => {
    closeFundModal();

    navigation.navigate(SCREENS.ADD_MONEY, {
      screen: SCREENS.MANUAL_FUND_STACK,
      params: { screen: SCREENS.START_MANUAL_FUNDING },
    });
  };

  /**
   *  my work
   */
  const handleDepositCrypto = () => {
    console.log("Deposit Crypto clicked!");
  closeFundModal();
  navigation.navigate(SCREENS.ADD_MONEY, {
    screen: SCREENS.DEPOSIT_CRYPTO, // make sure this exists in SCREENS
  });
};

// withdrawal 
const handleWithdrawCrypto = () => {
  setWithdrawModalVisible(false);

  navigation.navigate(SCREENS.WITHDRAW_MONEY, {
    screen: SCREENS.WITHDRAW_CRYPTO,
  });
};

const handleWithdrawNaira = () => {
  setWithdrawModalVisible(false);

  navigation.navigate(SCREENS.WITHDRAW_MONEY, {
    screen: SCREENS.WITHDRAW_NAIRA,
  });
};



  // ... all your hooks, useEffect, etc.

  // ✅ Define renderHeader BEFORE return
  const renderHeader = () => (
    <View style={tw`px-3 pt-6`}>

      {/* Balance Card */}
      <Card mode="contained" style={tw`bg-primary-50 py-2`}>
        <Card.Content style={tw`items-center`}>
          <View style={tw`flex-row justify-center items-center`}>
            <View>
              {balanceVisible ? (
                <View style={tw`flex-row items-baseline justify-center`}>
                  <View style={tw`items-center mr-4`}>
                    <Text style={tw`text-gray-900 font-bold text-xl`}>
                      {formatToNaira(nairaWalletBalance)}
                    </Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-gray-900 font-bold text-xl`}>
                      ${formattedBalance(cryptoUsdBalance, "", 2)}
                    </Text>
                  </View>
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

          <View style={tw`flex-row justify-center items-center gap-4 mt-2`}>
            <Button
              icon="wallet"
              mode="outlined"
              style={tw`border-primary flex-1`}
              onPress={() => setFundModalVisible(true)}
            >
              Fund Wallet
            </Button>
            <Button
              icon="cash-minus"
              mode="outlined"
              style={tw`border-danger flex-1`}
              onPress={() => setWithdrawModalVisible(true)}
            >
              Withdraw
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Profile Error Banner */}
      {hasProfileError && (
        <Pressable onPress={onRefresh} style={tw`mt-6`}>
          <Banner
            title="Network Error"
            content="We couldn't load some of your account details. Click to try again."
          />
        </Pressable>
      )}

      {/* Verification Banner */}
      {!isVerified && (
        <Pressable onPress={handleVerifyAccount} style={tw`mt-6`}>
          <Banner
            title="Account Verification"
            content="You are yet to verify your account, click to complete verification now."
          />
        </Pressable>
      )}

      {/* Services */}
      <View style={tw`my-4`}>
    {/*}    <Text style={tw`text-base font-medium text-gray-600 mb-3.5`}>Services</Text> */}
        <View style={tw`flex-row justify-around`}>
          <IconButtonWithLabel
              RenderIcon={ZapIcon}
              size={24}
              label="Buy / Sell+Crypto"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "Convert Crypto", //i made changes here 
                  },
                });
              }}
            />          
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

      {/* Tabs */}
      <View style={tw`my-4`}>
        <View style={tw`flex-row border-b border-gray-200`}>
          <TouchableOpacity style={tw`flex-1 py-2`} onPress={() => setActiveTab("wallets")}>
            <Text
              style={tw.style(
                `text-center font-semibold py-1`,
                activeTab === "wallets"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500"
              )}
            >
              Crypto Assets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={tw`flex-1 py-2`} onPress={() => setActiveTab("transactions")}>
            <Text
              style={tw.style(
                `text-center font-semibold py-1`,
                activeTab === "transactions"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500"
              )}
            >
              Transactions
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "wallets" && (
            <CryptoOverview />
        )}
      </View>
    </View>
  );

  // ✅ Return after renderHeader is defined
  return (
    <View style={tw`flex-1 bg-white`}>
      <UserAppbar />
                <CryptoProvider>

      <FlatList
        data={activeTab === "transactions" ? [1] : []}
        renderItem={() => <RecentTransactions navigation={navigation} />}
        keyExtractor={(item) => item.toString()}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={isFetchingProfile} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <FundAccountSheet
        show={fundModalVisible}
        hide={closeFundModal}
        navigation={{ handleDepositCrypto, handleManualFund }}
      />
      <WithdrawFundsSheet
        show={withdrawModalVisible}
        hide={() => setWithdrawModalVisible(false)}
        navigation={{ handleWithdrawCrypto, handleWithdrawNaira }}
      />
            </CryptoProvider>

      <ContactSupportButton />
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
                    <View style={tw`flex-row items-center gap-2`}>
                      <Text style={tw`text-gray-500 text-xs`}>
                        {format(transaction.created_at, "MMM dd, yyyy h:mm a")}
                      </Text>
                      <StatusBadge status={getTransactionStatus(transaction)} />
                    </View>
                  </View>
              {/*}    <Text style={tw`text-gray-900 font-semibold`}>{convertToNaira(transaction.amount, true)}</Text> */}
                  <Text style={tw`text-gray-900 font-semibold`}>{formatTransactionAmount(transaction)}</Text>
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
