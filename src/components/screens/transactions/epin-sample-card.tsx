import tw from "@lib/tailwind";
import { formatToNaira } from "@utils/money";
import { View } from "react-native";
import { Text } from "react-native-paper";

interface PaymentDetailsProps {
  sample?: boolean;
  values: {
    provider: string;
    amount: string;
    business_name: string;
    pin?: string;
    serial?: string;
  };
}

export default function EpinCardSample(props: PaymentDetailsProps) {
  const values = {
    ...props.values,
    pin: props.values.pin || "1234-9856-2829-4561",
    serial: props.values.serial || "4134186359470712",
  };

  return (
    <View style={tw`p-4 border relative`}>
      <View>
        <Text variant="titleMedium">
          {[values.provider.toUpperCase(), formatToNaira(values.amount), values.business_name].join(" | ")}
        </Text>
        <View style={tw`flex-row items-center gap-2`}>
          <Text variant="titleMedium">PIN:</Text>
          <Text variant="headlineMedium" style={tw`text-lg font-black`}>
            1234-9856-2829-4561
          </Text>
        </View>
        <View style={tw`flex-row items-center gap-2`}>
          <Text variant="titleMedium">Serial #:</Text>
          <Text variant="titleMedium">4134186359470712</Text>
        </View>
        <Text variant="titleMedium">Dial *555*PIN#, then Send</Text>
      </View>
      {props.sample && <View style={tw`absolute inset-0 justify-center items-center`}>
        <Text
          variant="displayLarge"
          style={[tw`font-black text-[#FF0000] opacity-60`, { transform: [{ rotate: "10.88deg" }] }]}>
          SAMPLE
        </Text>
      </View>}
    </View>
  );
}
