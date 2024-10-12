import TextInput from "@components/ui/form/TextInput";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import Screen from "@components/ui/shared/Screen";
import { SCREENS } from "@constants/screens";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ManualFundStackScreenProps } from "@navigators/types";
import { BankAccount } from "@type/transaction";
import { formatToNaira } from "@utils/money";
import React, { Fragment, useEffect } from "react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ImageBackground, RefreshControl, View } from "react-native";
import { Button, HelperText, IconButton, Text } from "react-native-paper";
import { z } from "zod";
import * as Clipboard from "expo-clipboard";
import { CopyFill } from "@components/icons/svg";
import API from "@lib/api";
import { route as apiRoute } from "@helpers/route";
import { showToast } from "@helpers/toast";
import Banner from "@components/ui/banner";
import ScrollableView from "@components/ui/shared/ScrollableView";
import DropdownMenuField from "@components/ui/form/DropdownMenu";

type ManualFundViewProps = ManualFundStackScreenProps<typeof SCREENS.MANUAL_FUND>;

const schema = z.object({
  narration: z.string(),
  amount: z.string().trim(),
  account_number: z.string().trim().length(10),
});

type FormValues = z.infer<typeof schema>;

export default function ManualFundScreen({ navigation, route }: ManualFundViewProps) {
  const [fetchingBanks, setFetchingBanks] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactionReference, setTransactionReference] = useState<string | null>(null);

  const { control, watch, setValue, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: route.params.amount,
      narration: "Manual deposit to account",
      account_number: "",
    },
  });

  const { account_number: selectedAccount, narration } = watch();
  const { amount } = route.params;

  const selectedBank = useMemo(() => {
    return bankAccounts.find((bank) => bank.account_number === selectedAccount);
  }, [bankAccounts, selectedAccount]);

  useEffect(() => {
    getBankAccounts();
  }, [route.params.amount]);

  const getBankAccounts = async () => {
    try {
      setFetchingBanks(true);

      const response = await API.get(apiRoute("funding.banks"));
      const { accounts } = response.data;
      setBankAccounts(accounts);
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingBanks(false);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    if (transactionReference) {
      return navigation.navigate(SCREENS.MANUAL_FUND_PROOF, {
        reference: transactionReference,
      });
    }

    try {
      setIsProcessing(true);
      const response = await API.post(apiRoute("funding.initiate"), data);
      const { transaction_info } = response.data;
      setTransactionReference(transaction_info?.reference);

      const description = `${narration} Reference:  ${transaction_info?.reference}`;
      setValue("narration", description);
    } catch (error) {
      showToast({ message: "Something went wrong. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  });

  const EmptyView = useMemo(() => {
    if (selectedAccount) return null;

    return <HelperText type="error">Please select a bank account to deposit money</HelperText>;
  }, [selectedAccount]);

  return (
    <Screen>
      <ScrollableView
        refreshControl={<RefreshControl refreshing={false} onRefresh={getBankAccounts} />}
        contentContainerStyle={tw`justify-between px-4 py-5`}>
        <View>
          <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            Deposit Money
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-400`}>
            Kindly make a <Text style={tw`font-semibold text-gray-600`}>{formatToNaira(amount)}</Text> deposit to the
            account details below and confirm deposit when it's done.
          </Text>

          {transactionReference && (
            <Banner
              variant="info"
              content="Deposit initiated, proceed to make payment using the provided account details"
              style={tw`mt-5`}
            />
          )}

          <View style={tw`mt-4`}>
            <DropdownMenuField
              control={control}
              name="account_number"
              label="Bank To Use"
              placeholder="Select Bank"
              data={bankAccounts.map((bank) => ({
                label: `${bank.bank_name} - ${bank.account_name}`,
                id: bank.account_number,
              }))}
            />
          </View>

          {!transactionReference && (
            <Controller
              control={control}
              name="narration"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TextInput
                  label="Narration"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter narration"
                  multiline={true}
                  error={!!error}
                  style={tw`h-24`}
                  errorMessage={error?.message}
                />
              )}
            />
          )}

          {EmptyView}

          {selectedBank && <SelectedBankDetails selected={selectedBank} reference={transactionReference} />}
        </View>

        <View style={tw`pb-4 pt-1 mt-10`}>
          <Button
            mode="contained"
            onPress={onSubmit}
            disabled={isProcessing || fetchingBanks}
            contentStyle={tw`py-2`}
            style={tw`w-full rounded-full`}
            labelStyle={tw`text-white text-center text-base font-bold`}>
            {transactionReference ? "Money Deposited" : "Initiate Transaction"}
          </Button>
        </View>
      </ScrollableView>

      <PleaseWaitModal visible={isProcessing || fetchingBanks} />
    </Screen>
  );
}
type SelectedBankDetailsProps = {
  selected: BankAccount;
  reference: string | null;
};

const SelectedBankDetails: React.FC<SelectedBankDetailsProps> = ({ selected, reference }) => {
  const [accountNumberCopied, setAccountNumberCopied] = useState(false);
  const [referenceNumberCopied, setReferenceNumberCopied] = useState(false);

  const copyToClipboard = async (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ImageBackground
      source={require("@assets/images/card-background-waves.png")}
      style={tw`bg-primary-900 p-4 rounded-lg shadow-xl shadow-primary/20 mt-4`}>
      <View style={tw`mt-5 gap-2`}>
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-white`}>Account Name</Text>
          <Text style={tw`text-base font-bold text-white`}>{selected.account_name}</Text>
        </View>
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-white`}>Bank Name</Text>
          <Text style={tw`text-base font-bold text-white`}>{selected.bank_name}</Text>
        </View>
        <View style={tw`flex-row items-center justify-between`}>
          <Text style={tw`text-white`}>Account Number</Text>
          <View style={tw`flex-row font-bold items-center`}>
            <Text style={tw`text-base text-white`}>{selected.account_number}</Text>
            <IconButton
              onPress={() => copyToClipboard(selected.account_number, setAccountNumberCopied)}
              icon={accountNumberCopied ? "sticker-check" : (props) => <CopyFill {...props} />}
              iconColor="white"
              style={tw`m-0`}
            />
          </View>
        </View>
        {reference && (
          <Fragment>
            <View style={tw`flex-col items-start justify-start`}>
              <Text style={tw`text-white`}>Reference Number</Text>
              <View style={tw`flex-row font-bold items-center ml-auto justify-end`}>
                <Text style={tw`text-base text-white`}>{reference}</Text>
                <IconButton
                  onPress={() => copyToClipboard(reference, setReferenceNumberCopied)}
                  icon={referenceNumberCopied ? "sticker-check" : (props) => <CopyFill {...props} />}
                  iconColor="white"
                  style={tw`m-0`}
                />
              </View>
            </View>
            <Banner content="Kindly ensure you use Reference number as transaction narration. It will be used to verify your transaction." />
          </Fragment>
        )}
      </View>
    </ImageBackground>
  );
};
