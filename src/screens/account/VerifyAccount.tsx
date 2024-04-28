import Screen from "@components/ui/shared/Screen";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { AccountStackScreenProps } from "@navigators/types";
import { getNavigate } from "@utils/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { z } from "zod";

type Props = AccountStackScreenProps<"Verify Account">;

const schema = z.object({
  dob: z.string(),
  bvn: z.string(),
});

export default function VerifyAccountScreen({ navigation }: Props) {
  const [fetching, setFetching] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      dob: "11/12/1999",
      bvn: "1234567890",
    },
  });

  const onSubmit = handleSubmit(async function (values) {
    const { reset } = await getNavigate();
    reset({ routes: [{ name: "Main" }] });
  });

  return (
    <Screen>
      <View style={tw`flex flex-col px-4 pt-10 justify-between h-full`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
            BVN Verification
          </Text>
          <Text
            style={tw`w-full text-gray-500 text-base font-normal leading-snug mb-10`}
          >
            Enter the details below to verify your BVN.
          </Text>
        </View>
        <Button
          style={tw`mt-auto mb-[30px] w-full rounded-full`}
          contentStyle={tw`p-2`}
          disabled={fetching}
          onPress={onSubmit}
          mode="contained"
        >
          <Text style={tw`text-white text-center text-base font-bold`}>
            Fake Complete
          </Text>
        </Button>
      </View>
    </Screen>
  );
}
