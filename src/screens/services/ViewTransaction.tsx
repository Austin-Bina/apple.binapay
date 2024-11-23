import { Colors } from "@constants/theme/colors";
import tw from "@lib/tailwind";
import { HomeStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { getPendingTransaction } from "@store/slice/transactionSlice";
import { resetNavigationToDashboard } from "@utils/navigation";
import {
  defaultTransactionResponse,
  getTransactionDetails,
  viewTransactionHelper,
  viewTransactionResponse,
} from "@helpers/transaction";
import React, { Fragment, useMemo, useState } from "react";
import { View, ImageBackground, useWindowDimensions, ScrollView } from "react-native";
import { Image } from "react-native-element-image";
import { IconButton, Text, TouchableRipple } from "react-native-paper";
import { match } from "ts-pattern";
import { SCREENS } from "@constants/screens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShareTransactionReceipt } from "@hooks/transaction";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import Banner from "@components/ui/banner";
import { format } from "date-fns";
import { CopyFill } from "@components/icons/svg";
import * as Clipboard from "expo-clipboard";
import Button from "@components/ui/form/button";
import ScrollableView from "@components/ui/shared/ScrollableView";
import EpinCardSample from "@components/screens/transactions/epin-sample-card";

type Props = HomeStackScreenProps<typeof SCREENS.VIEW_TRANSACTION>;

export default function ViewTransaction({ route }: Props) {
  const [valueCopied, setValueCopied] = useState(false);
  const [visibleEpins, setVisibleEpins] = useState(10);

  const { transactionId } = route.params;

  const { shareTransactionReceipt, isPrinting, printingError, stopSharing } = useShareTransactionReceipt();
  const insets = useSafeAreaInsets();
  const pendingTransaction = useTypedSelector((state) => getPendingTransaction(state.transaction, transactionId));
  const { width } = useWindowDimensions();

  const utilityResponse = useMemo(() => {
    return match(pendingTransaction)
      .with({ data: { response: { transaction_info: { transaction: {} } } } }, ({ data }) => data.response)
      .otherwise(() => null);
  }, [pendingTransaction]);

  const viewResponse = useMemo(() => {
    return match(pendingTransaction)
      .with({ view: {} }, ({ view }) => view)
      .otherwise(() => null);
  }, [pendingTransaction]);

  const pageData = useMemo(() => {
    const data = utilityResponse ? viewTransactionResponse(utilityResponse) : viewTransactionHelper(viewResponse);

    return {
      ...defaultTransactionResponse,
      transactionTitle: defaultTransactionResponse.title,
      transactionDescription: defaultTransactionResponse.description,
      transactionDetails: [] as ReturnType<typeof getTransactionDetails>,
      transactionDate: format(new Date(), "MMM dd, yyyy h:mm a"),
      appLogo: "https://binapay.co/assets/icons/logo-black.svg",
      promotionalText: `<p style="margin-bottom: 16px;">Unlock exclusive offers and rewards with <strong>BinaPay</strong>. Stay tuned for exciting promotions!</p>`,
      supportEmail: "support@binapay.co",
      hasDetails: false,
      logo: "",
      ...data,
    };
  }, [viewResponse, utilityResponse]);

  const printData = {
    pageData: { ...pageData, supportEmail: "" },
  };

  const copyBillPaymentValueToken = async () => {
    if (pageData.hasHighlighted?.copyable) {
      await Clipboard.setStringAsync(pageData.hasHighlighted.value);
      setValueCopied(true);
      setTimeout(() => setValueCopied(false), 2000);
    }
  };

  const handlePrintEpin = () => {
    // shareTransactionReceipt({ pageData: printData.pageData, getTemplate: generateEpinsTemplate });
  };

  const loadMoreEpins = () => {
    setVisibleEpins((prev) => prev + 10);
  };

  return (
    <ImageBackground source={require("@assets/images/background-without-logo.png")} style={tw`flex-1 justify-between`}>
      <ScrollableView contentContainerStyle={tw`justify-between px-4 py-5`}>
        <Image
          source={require("@assets/images/logo-with-name.png")}
          height={50}
          style={tw.style(`mb-5 mx-auto`, {
            marginTop: insets.top,
          })}
        />

        <View style={tw`bg-white w-full p-4 rounded-3xl border border-primary-200`}>
          <View>
            <View>
              <Text style={tw`font-bold text-lg text-center text-primary-900 mb-2.5`}>{pageData.transactionTitle}</Text>
            </View>
            <View style={tw`items-center justify-around p-0`}>
              <Image width={60} height={60} style={tw`bg-transparent rounded-lg`} source={{ uri: pageData.logo }} />
              {pageData.hasDetails ? (
                <View style={tw`gap-2 my-5 w-full`}>
                  {pageData.transactionDetails.map((item) => (
                    <View key={item.value} style={tw`flex-row justify-between`}>
                      <Text variant="labelSmall">{item.label}:</Text>
                      <Text selectable selectionColor={Colors.primary[200]} style={[tw`font-bold text-right`, { maxWidth: width - width / 2 }]}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text variant="bodyMedium" style={tw`text-gray-500 text-center`}>
                  {pageData.transactionDescription}
                </Text>
              )}
            </View>
          </View>

          {printingError && (
            <Banner variant="error" title="Oops! We could not print the receipt" content={printingError} />
          )}

          {pageData.hasHighlighted && (
            <TouchableRipple
              onPress={copyBillPaymentValueToken}
              style={tw`flex-row justify-center items-center gap-1 my-5 bg-gray-300 px-2 rounded-md`}>
              <Fragment>
                <Text style={tw`text-gray-700 text-lg font-bold`}>{pageData.hasHighlighted.value}</Text>
                {pageData.hasHighlighted.copyable && (
                  <IconButton
                    onPress={copyBillPaymentValueToken}
                    icon={valueCopied ? "sticker-check" : (props) => <CopyFill {...props} />}
                    iconColor="white"
                    style={tw`m-0 p-0`}
                    size={24}
                  />
                )}
              </Fragment>
            </TouchableRipple>
          )}

          {pageData.epins && pageData.epins.length > 0 && (
            <ScrollView style={tw`mt-5 flex-1`} contentContainerStyle={tw`gap-4`}>
              {pageData.epins.slice(0, visibleEpins).map((epin, index) => (
                <EpinCardSample key={index} values={epin} />
              ))}
              {visibleEpins < pageData.epins.length && (
                <Button mode="contained-tonal" onPress={loadMoreEpins} style={tw`py-0`}>
                  Load More E-Pins
                </Button>
              )}
            </ScrollView>
          )}

          {pageData.hasDetails && (
            <Button
              onPress={() => shareTransactionReceipt(printData)}
              mode="contained-tonal"
              style={tw`w-full`}
              buttonColor={Colors.primary[100]}
              textColor={Colors.primary[600]}>
              Share Receipt
            </Button>
          )}
        </View>
        <Button onPress={resetNavigationToDashboard} mode="contained" style={tw`w-full`}>
          Continue to Home
        </Button>
      </ScrollableView>
      <PleaseWaitModal visible={isPrinting} dismissable onDismiss={stopSharing} />
    </ImageBackground>
  );
}

