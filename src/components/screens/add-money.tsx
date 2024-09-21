import NairaInput from "@components/ui/form/NairaInput";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { AddMoneyStackScreenProps } from "@navigators/types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ImageBackground, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";
import { z } from "zod";
import * as Clipboard from "expo-clipboard";
import Banner from "@components/ui/banner";
import { DVA } from "@type/user";
import { SCREENS } from "@constants/screens";
import { zodAmountValidation } from "@utils/money";

type ManualFundViewProps = AddMoneyStackScreenProps<"Fund Account Options"> & {
  comingSoon?: boolean;
};

const schema = z.object({
  amount: zodAmountValidation(2000),
});

const ManualFundView: React.FC<ManualFundViewProps> = ({ navigation }) => {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "2000",
    },
  });

  const onSubmit = handleSubmit(async ({ amount }) => {
    navigation.navigate(SCREENS.MANUAL_FUND_STACK, {
      screen: SCREENS.MANUAL_FUND,
      params: {
        amount: amount,
      },
    });
  });

  return (
    <View style={tw`flex-1 justify-between`}>
      <View style={tw`flex-1`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          Manual Funding
        </Text>
        <Text variant="bodyMedium" style={tw`text-gray-400`}>
          Fund your BinaPay wallet manually. The minimum amount is ₦2,000.
        </Text>
        <Banner style={tw`mt-6`} message="Manual funding requires a minimum of ₦2,000." />
        <NairaInput name="amount" control={control} />
      </View>
      <Button style={tw`mt-10 w-full rounded-full`} contentStyle={tw`py-2`} onPress={onSubmit} mode="contained">
        Continue
      </Button>
    </View>
  );
};

type BankProps = {
  accounts: DVA[];
};

const BankView: React.FC<BankProps> = ({ accounts }) => (
  <View>
    <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
      Fund with Bank Transfer
    </Text>
    <Text variant="bodyMedium" style={tw`text-gray-400 mb-6`}>
      Transfer the desired amount to the following bank account. Once the transfer is complete, your BinaPay wallet will
      be credited
    </Text>
    <Banner message="Automated bank transfer attracts additional charges of 4% only." />
    {accounts.map((account) => (
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
  </View>
);

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
          <IconButton onPress={copyToClipboard} icon={copied ? "sticker-check" : "content-copy"} iconColor="white" />
        </View>
      </View>
    </View>
  );
};

export { ManualFundView, BankCard, BankView };
