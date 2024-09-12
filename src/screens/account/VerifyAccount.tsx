import CustomTextInput from "@components/ui/form/TextInput";
import PleaseWaitModal from "@components/ui/modals/PleaseWaitModal";
import Screen from "@components/ui/shared/Screen";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import tw from "@lib/tailwind";
import { AccountStackScreenProps } from "@navigators/types";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { getNavigate } from "@utils/navigation";
import { AxiosError } from "axios";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { z } from "zod";

type Props = AccountStackScreenProps<"Verify Account">;

const schema = z.object({
  bvn: z
    .string()
    .length(11, 'Must be 11 digits')
    .transform((val) => {
      const numericValue = val.slice(0, 11);
      return numericValue;
    })
    .refine((val) => /^[0-9]+$/.test(val), {
      message: "BVN must only contain numbers",
    }),
});

export default function VerifyAccountScreen() {
  const [fetching, setFetching] = useState(false);

  const dispatch = useTypedDispatch();

  const { control, handleSubmit, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      bvn: "",
    },
  });

  const onSubmit = handleSubmit(async function (form) {
    try {
      setFetching(true);
      const response = await API.post(route("account.reserveAccount"), form);
      const { accounts } = response.data;

      dispatch(authSliceActions.updateUser({ accounts }));

      const { reset } = await getNavigate();
      reset({ routes: [{ name: "Main" }] });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message, errors } = response.data;

        const hasAuthErrorMsg = message && typeof message === "string";

        if (hasAuthErrorMsg) {
          showToast({ message: message });
        } else {
          showToast({ message: "Something went wrong. Please try again." });
        }

        if (errors?.bvn) {
          setError("bvn", { message: errors.bvn[0] });
        }
      }
    } finally {
      setFetching(false);
    }
  });

  return (
    <Screen>
      <View style={tw`flex flex-col px-4 pt-10 justify-between h-full`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>BVN Verification</Text>
          <Text style={tw`w-full text-gray-500 text-base font-normal leading-snug mb-10`}>
            Enter the details below to verify your BVN.
          </Text>
        </View>
        <Controller
          control={control}
          name="bvn"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <CustomTextInput
              label="Bank verification number"
              placeholder="Enter your BVN"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={!!error}
              errorMessage={error?.message}
            />
          )}
        />
        <Button
          style={tw`mt-auto mb-[30px] w-full rounded-full`}
          contentStyle={tw`p-2`}
          disabled={fetching}
          onPress={onSubmit}
          mode="contained">
          <Text style={tw`text-white text-center text-base font-bold`}>Verify</Text>
        </Button>
      </View>
      <PleaseWaitModal visible={fetching} />
    </Screen>
  );
}
