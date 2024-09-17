import NairaInput from "@components/ui/form/NairaInput";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { AddMoneyStackScreenProps } from "@navigators/types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dimensions, ImageBackground, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";
import { scale } from "react-native-size-matters";
import { z } from "zod";
import * as Clipboard from "expo-clipboard";
import Banner from "@components/ui/banner";
import { Image } from "react-native-element-image";
import { DVA } from "@type/user";

type CardViewProps = AddMoneyStackScreenProps<"Fund Account Options"> & {
  comingSoon?: boolean;
};

const schema = z.object({
  amount: z.string(),
});

const deviceWidth = Dimensions.get("window").width;

const CardView: React.FC<CardViewProps> = ({ navigation, comingSoon }) => {
  const { control, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
    },
  });
  const values = watch();

  const onSubmit = () => {
    navigation.navigate("Card Details");
  };

  if (comingSoon) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          Coming Soon
        </Text>
        <Text variant="bodyMedium" style={tw`text-gray-400`}>
          This feature is not yet available.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
        Fund with Card
      </Text>
      <Text variant="bodyMedium" style={tw`text-gray-400`}>
        Use your card to conveniently add funds to your BinaPay wallet.
      </Text>
      <Banner style={tw`mt-6`} message="Funding wallet with card attracts additional charges of 4% only." />
      <View>
        <NairaInput name="amount" control={control} />
        <View style={tw`bg-green-50 mt-4 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full`}>
          <Text variant="bodyMedium" style={tw`text-green-600 text-center font-bold`}>
            You get ₦{values.amount}
          </Text>
        </View>
      </View>
      <Button
        style={tw`mt-10 mb-[30px] w-full rounded-full`}
        contentStyle={tw`py-2`}
        onPress={onSubmit}
        mode="contained">
        <Text style={tw`text-white text-center text-base font-bold`}>Continue</Text>
      </Button>

      <Image
        source={require("@assets/images/secured-by-paystack.png")}
        width={scale(deviceWidth - 200)}
        style={tw`mx-auto`}
      />
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

export { CardView, BankCard, BankView };
