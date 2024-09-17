import Banner from "@components/ui/banner";
import NairaInput from "@components/ui/form/NairaInput";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { AddMoneyStackScreenProps } from "@navigators/types";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { z } from "zod";

type ManualFundViewProps = AddMoneyStackScreenProps<"Manual Fund">;

const schema = z.object({
  amount: z.string(),
  narration: z.string(),
  account_number: z.string(),
});

const ManualFundScreen: React.FC<ManualFundViewProps> = ({ navigation }) => {
  const { control, watch, setValue, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "5000",
      narration: "My Account",
      account_number: "1234567890",
    },
  });

  const values = watch();

  const onSubmit = () => {
    // navigation.navigate("Card Details");
  };

  return (
    <View>
      <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
        Manual Transfer
      </Text>
      <Text variant="bodyMedium" style={tw`text-gray-400`}>
       Fund your account via a manual transfer to any of the provided bank accounts.
      </Text>
      <Banner style={tw`mt-6`} message="Funding wallet with card attracts additional charges of 2% only." />
      <View>
        <Text variant="titleMedium" style={tw`text-gray-800 mb-2 font-bold`}>
          Account Details
        </Text>

        <NairaInput name="amount" control={control} />
        <View style={tw`bg-green-50 mt-4 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full`}>
          <Text variant="bodyMedium" style={tw`text-green-600 text-center font-bold`}>
            You get ₦{values.amount}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ManualFundScreen;
