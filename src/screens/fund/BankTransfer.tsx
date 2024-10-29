import Banner from "@components/ui/banner";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import tw from "@lib/tailwind";
import { useTypedSelector } from "@store/common";
import { selectIsAccountVerified } from "@store/selectors/auth";
import { useEffect, useMemo, useState } from "react";
import { ImageBackground, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import { SCREENS } from "@constants/screens";
import { getNavigate } from "@utils/navigation";
import { selectSystemSettings } from "@store/selectors/settings";
import { CopyFill } from "@components/icons/svg";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { useCreateAccountMutation, useListAccountsQuery } from "@store/redux-api/accountsApi";
import { selectCanCreateMoreAccounts } from "@store/selectors/accounts";

export default function BankTransferScreen() {
  const isVerified = useTypedSelector(selectIsAccountVerified);
  const { customers } = useTypedSelector(selectSystemSettings);

  const { data: accountsQuery } = useListAccountsQuery(undefined, {
    pollingInterval: 15000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  
  const [createDedicatedAccount, { isLoading: isCreatingAccount }] = useCreateAccountMutation();

  const canCreateMoreAccounts = useTypedSelector(selectCanCreateMoreAccounts());

  const prefetchSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });

  useEffect(() => {
    prefetchSettings();
  }, []);

  const userAccounts = useMemo(() => accountsQuery?.accounts ?? [], [accountsQuery]);

  const handleBeginVerification = async () => {
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

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 py-5 justify-between`}>
        <View>
          <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            Fund with Bank Transfer
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-400 mb-6`}>
            Transfer the desired amount to the following bank account. Once the transfer is complete, your BinaPay
            wallet will be credited
          </Text>

          {userAccounts.length > 0 && (
            <Banner
              content={`Automated bank transfer attracts additional charges of ${customers.account_deposit_charge_percentage}% only.`}
            />
          )}

          {userAccounts.length > 0 &&
            userAccounts.map((account) => (
              <View key={account.id}>
                <ImageBackground
                  source={require("@assets/images/card-background-waves.png")}
                  style={tw`bg-primary-900 p-4 rounded-lg shadow-xl shadow-primary/20 mt-4`}>
                  <BankCard
                    accountName={account.account_name}
                    bankName={account.bank_name}
                    accountNumber={account.account_number}
                  />
                </ImageBackground>
              </View>
            ))}

          {!isVerified && (
            <Banner
              title="Please verify your account to use this feature"
              content="This feature is only available for verified users with dedicated accounts."
            />
          )}

          {userAccounts.length === 0 && (
            <View style={tw`mt-4`}>
              <Text variant="bodyMedium" style={tw`text-gray-400 mb-6`}>
                You have not created a wallet for BinaPay. Click the create account button to proceed.
              </Text>
              <Button
                style={tw`w-full rounded-full`}
                contentStyle={tw`py-2`}
                mode="contained"
                onPress={createDedicatedAccount}>
                Create Accounts
              </Button>
            </View>
          )}

          {canCreateMoreAccounts && userAccounts.length > 0 && (
            <View style={tw`mt-4`}>
              <Text variant="bodyMedium" style={tw`text-gray-400 mb-6`}>
                You can create more accounts for funding your wallet, we give multiple options. Click the create more
                accounts button to continue.
              </Text>
              <Button
                style={tw`w-full rounded-full`}
                contentStyle={tw`py-2`}
                mode="contained"
                onPress={createDedicatedAccount}>
                Create More Accounts
              </Button>
            </View>
          )}
        </View>
        {!isVerified && (
          <View style={tw`pb-4 pt-1`}>
            <Button
              style={tw`w-full rounded-full`}
              contentStyle={tw`py-2`}
              mode="contained"
              onPress={handleBeginVerification}>
              Begin Verification
            </Button>
          </View>
        )}
      </ScrollableView>
      <PleaseWaitModal visible={isCreatingAccount} />
    </Screen>
  );
}

interface BankCardProps {
  accountName: string;
  bankName: string;
  accountNumber: string;
}

const BankCard: React.FC<BankCardProps> = ({ accountName, bankName, accountNumber }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View>
      <View style={tw`flex-row justify-between`}>
        <Text style={tw`text-white`}>Account Name</Text>
        <Text style={tw`text-base font-bold text-white`}>{accountName}</Text>
      </View>
      <View style={tw`flex-row justify-between`}>
        <Text style={tw`text-white`}>Bank Name</Text>
        <Text style={tw`text-base font-bold text-white`}>{bankName}</Text>
      </View>
      <View style={tw`flex-row items-center justify-between`}>
        <Text style={tw`text-white`}>Account Number</Text>
        <View style={tw`flex-row font-bold items-center`}>
          <Text style={tw`text-base text-white`}>{accountNumber}</Text>
          <IconButton
            onPress={copyToClipboard}
            icon={copied ? "sticker-check" : (props) => <CopyFill {...props} />}
            iconColor="white"
          />
        </View>
      </View>
    </View>
  );
};
