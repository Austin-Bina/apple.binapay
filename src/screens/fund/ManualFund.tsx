import TextInput from "@components/ui/form/TextInput";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import Screen from "@components/ui/shared/Screen";
import { SCREENS } from "@constants/screens";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ManualFundStackScreenProps } from "@navigators/types";
import Paginator from "@screens/onboarding/Paginator";
import { BankAccount } from "@type/transaction";
import { formatToNaira } from "@utils/money";
import React, { useEffect } from "react";
import { Fragment, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Animated,
  FlatList,
  ImageBackground,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { ActivityIndicator, Avatar, Button, HelperText, IconButton, Text, TouchableRipple } from "react-native-paper";
import { scale } from "react-native-size-matters";
import { z } from "zod";
import * as Clipboard from "expo-clipboard";
import { BeautifyCopy } from "@components/icons/svg";
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
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const slideRef = useRef<FlatList<BankAccount>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const dimensions = useWindowDimensions();
  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index);
  }).current;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const { account_number: selectedAccount, narration } = watch();
  const { amount } = route.params;
  const width = scale(dimensions.width - 200);

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
      const { transaction_info, message = "" } = response.data;
      setTransactionReference(transaction_info?.reference);

      const description = `${narration} Reference:  ${transaction_info?.reference}`;
      setValue("narration", description);
    } catch (error) {
      showToast({ message: "Something went wrong. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  });

  const scrollTo = () => {
    if (slideRef.current && currentIndex < bankAccounts.length - 1) {
      slideRef.current.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const EmptyView = useMemo(() => {
    if (selectedAccount) return null;

    return <HelperText type="error">Please select a bank account to deposit money</HelperText>;
  }, [selectedAccount]);

  const renderEmptyList = () => {
    if (fetchingBanks) {
      return (
        <View style={tw`flex-1 items-center justify-center p-4 h-[80px]`}>
          <ActivityIndicator size="small" color={"gray"} animating={true} />
        </View>
      );
    }

    return (
      <View style={tw`flex-1 items-center justify-center p-4`}>
        <HelperText type="error">No bank accounts found</HelperText>
      </View>
    );
  };

  const renderBankAccount = ({ item }: { item: BankAccount }) => (
    <TouchableRipple
      onPress={() => {
        setValue("account_number", item.account_number);
      }}
      style={[
        tw`p-4 flex-row items-center gap-3 border-2 rounded-xl mr-2`,
        selectedAccount === item.account_number ? tw`border-primary-500` : tw`border-gray-200`,
        { width },
      ]}>
      <Fragment>
        <Avatar.Image source={{ uri: item.logo }} size={32} style={tw`flex-none bg-gray-300`} />
        <View>
          <Text style={tw`font-normal text-xs text-gray-400`}>{item.bank_name}</Text>
          <Text style={tw`leading-6 font-light`}>{item.account_name}</Text>
        </View>
      </Fragment>
    </TouchableRipple>
  );

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
            account details below and confirm deposit when it’s done.
          </Text>

          {transactionReference && (
            <Banner
              variant="info"
              message="Deposit initiated, proceed to make payment using the provided account details"
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

          {/* <FlatList
            ref={slideRef}
            horizontal
            data={bankAccounts}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={width}
            keyExtractor={(item) => item.account_number}
            renderItem={renderBankAccount}
            contentContainerStyle={tw`my-4`}
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: false,
            })}
            ListEmptyComponent={renderEmptyList}
            onViewableItemsChanged={viewableItemsChanged}
            viewabilityConfig={viewConfig}
            scrollEventThrottle={32}
            pagingEnabled
            disableIntervalMomentum
          />

          <View>
            <Paginator
              size={bankAccounts.length}
              scrollX={scrollX}
              scrollTo={scrollTo}
              currentIndex={currentIndex}
              style={tw`mb-4`}
              dotStyle={{
                height: 4,
              }}
            />
          </View> */}

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

        <View style={tw`px-4 pb-4 pt-1 mt-10`}>
          <Button
            mode="contained"
            onPress={onSubmit}
            disabled={isProcessing}
            contentStyle={tw`py-2`}
            style={tw`w-full rounded-full`}
            labelStyle={tw`text-white text-center text-base font-bold`}>
            {transactionReference ? "Money Deposited" : "Initiate Transaction"}
          </Button>
        </View>
      </ScrollableView>

      <PleaseWaitModal visible={isProcessing} />
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
              icon={accountNumberCopied ? "sticker-check" : "content-copy"}
              iconColor="white"
            />
          </View>
        </View>
        {reference && (
          <View style={tw`flex-col items-start justify-start`}>
            <Text style={tw`text-white`}>Reference Number</Text>
            <View style={tw`flex-row font-bold items-center justify-end`}>
              <Text style={tw`text-base text-white`}>{reference}</Text>
              <IconButton
                onPress={() => copyToClipboard(reference, setReferenceNumberCopied)}
                icon={referenceNumberCopied ? "sticker-check" : "content-copy"}
                iconColor="white"
              />
            </View>
          </View>
        )}
        <Banner message="Kindly ensure you use Reference number as transaction narration. It will be used to verify your transaction." />
      </View>
    </ImageBackground>
  );
};

const DetailsItemCopy = React.memo(({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(value);

    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <View style={tw`flex-row justify-between mb-4`}>
      <View style={tw`gap-0.5`}>
        <Text variant="bodyLarge" style={tw`text-gray-900`}>
          {label}
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          {value}
        </Text>
      </View>
      <TouchableOpacity onPress={copyToClipboard} style={tw`flex-row items-center justify-center gap-2`}>
        <Fragment>
          <Text variant="labelSmall" style={tw`text-white text-gray-500 -mr-1`}>
            {copied ? "Copied" : "Copy"}
          </Text>
          <BeautifyCopy />
        </Fragment>
      </TouchableOpacity>
    </View>
  );
});
