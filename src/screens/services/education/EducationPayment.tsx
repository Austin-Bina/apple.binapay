import { AvatarImage } from "@components/avatar";
import Banner from "@components/ui/banner";
import EducationEmptyState from "@components/ui/empty-states/education";
import EducationErrorState from "@components/ui/error-states/education";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import NairaInput from "@components/ui/form/NairaInput";
import CustomTextInput from "@components/ui/form/TextInput";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { TransactionForm } from "@enum/transaction";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { EducationStackScreenProps } from "@navigators/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { useGetEducationPlansQuery, useGetEducationServiceDetailsQuery } from "@store/redux-api/utilityBillsQueryApi";
import { selectUser } from "@store/selectors/auth";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { formatToNaira } from "@utils/money";
import { getNavigate } from "@utils/navigation";
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { RefreshControl, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { z } from "zod";

type Props = EducationStackScreenProps<"Educational Payment">;

const schema = z.object({
  provider: z.string(),
  variation_code: z.string(),
  amount: z.string(),
  quantity: z
    .string()
    .transform((val) => (val ? Number.parseInt(val) : 1))
    .refine((val) => val > 0, { message: "Quantity must be greater than 0" }),
  phone: z.string(),
  product_name: z.string(),
  profile_code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EducationPaymentScreen({ route }: Props) {
  const { provider } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);

  const user = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();
  const { data: educationPlans } = useGetEducationPlansQuery();
  const {
    data: queryData,
    isFetching,
    error,
    refetch,
  } = useGetEducationServiceDetailsQuery({
    service_id: provider,
  });

  const screenData = queryData;
  const educationPlan = useMemo(
    () => educationPlans?.education_plans.find((plan) => plan.serviceId === provider),
    [provider, educationPlans],
  );

  const { control, setValue, handleSubmit, watch, trigger, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider,
      product_name: "",
      variation_code: "",
      profile_code: "",
      phone: user?.phone,
      quantity: "1",
      amount: "0",
    },
  });

  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const values = watch();

  useEffect(() => {
    const quantity = values.quantity;
    if (quantity && !isNaN(quantity)) {
      const amount = quantity * Number.parseFloat(values.amount);
      setValue("amount", String(amount));
    }
  }, [values.quantity]);

  const openBottomSheet = useCallback(() => {
    trigger().then((allGood) => {
      allGood && bottomSheet.current?.present();
    });
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheet.current?.dismiss();
  }, []);

  const handleMakePayment = handleSubmit(async (values) => {
    const transaction = {
      id: TransactionForm.Education,
      data: values,
    };

    dispatch(addPendingTransaction(transaction));

    const { navigate } = await getNavigate();

    navigate("Main", {
      screen: "Services",
      params: {
        screen: "Confirm Transaction",
        params: {
          transactionId: transaction.id,
        },
      },
    });

    closeBottomSheet();
  });

  const generateFormFields = () => {
    if (!screenData) return null;

    const inputFields = screenData.inputFields;

    return inputFields.map((field) => {
      const options =
        field.options?.map((option) => ({
          ...option,
          label: option.name,
          id: option.variation_code,
        })) || [];

      if (field.options) {
        return (
          <DropdownMenuField
            key={field.name}
            label={field.label}
            placeholder={field.placeholder}
            name={field.name}
            control={control}
            data={options}
            onDataSelect={(plan) => {
              reset({
                ...values,
                amount: plan.variation_amount,
                variation_code: plan.id,
                product_name: plan.name,
              });
            }}
          />
        );
      }

      return (
        <Controller
          key={field.name}
          control={control}
          name={field.name as keyof FormValues}
          render={({ fieldState, field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              label={field.label}
              value={value ? String(value) : ""}
              placeholder={field.placeholder}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!fieldState.error}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
      );
    });
  };

  const dynamicContent = () => {
    if (isFetching) {
      return (
        <View style={tw`px-4`}>
          <Text variant="bodySmall" style={tw`text-gray-500`}>
            Hang on a sec, we're fetching your education plan details.
          </Text>
        </View>
      );
    }

    if (!!error && !isFetching) {
      return (
        <View style={tw`px-4`}>
          <EducationErrorState />
        </View>
      );
    }

    if (!screenData || !educationPlan) {
      return (
        <View style={tw`px-4`}>
          <EducationEmptyState />
        </View>
      );
    }

    return (
      <Fragment>
        <ScrollableView style={tw`px-4`} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
          <Text variant="titleMedium" style={tw`text-gray-800 mb-2 font-bold`}>
            {screenData.title}
          </Text>
          <Text variant="bodySmall" style={tw`text-gray-500`}>
            {screenData.description}
          </Text>
          {screenData.banner && <Banner message={screenData.banner} style={tw`my-5`} />}
          {generateFormFields()}
          <View style={tw`mb-5`}>
            <NairaInput name="amount" control={control} isDisabled />
            <Text style={tw`text-primary-900 text-sm mt-2.5`}>
              Wallet Balance: {formatToNaira(user?.wallet_balance)}
            </Text>
          </View>
        </ScrollableView>
        <View style={tw`px-4 pb-4 pt-1`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            labelStyle={tw`text-white text-center text-base font-bold`}
            disabled={isProcessing}
            onPress={openBottomSheet}
            mode="contained">
            Continue
          </Button>
        </View>
        <BottomSheetModal
          ref={bottomSheet}
          initialSnapPoints={["50%", "50%"]}
          closeFilter={closeBottomSheet}
          children={
            <View style={tw`p-4`}>
              <Text variant="titleLarge" style={tw`font-bold text-gray-800 mb-2`}>
                Confirm Bill Payment
              </Text>
              <View>
                <View style={tw`flex-row justify-between my-2`}>
                  <Text variant="bodyLarge">Product Name:</Text>
                  <View style={tw`flex-row items-center gap-2.5`}>
                    <AvatarImage avatar={educationPlan.logo} size={30} />
                    <Text style={tw`text-lg font-bold`}>{educationPlan.name}</Text>
                  </View>
                </View>
                <View style={tw`flex-row justify-between my-2`}>
                  <Text variant="bodyLarge">Amount:</Text>
                  <Text style={tw`text-lg font-bold`}>{formatToNaira(values.amount)}</Text>
                </View>
                {/* <View style={tw`flex-row items-center justify-between my-2`}>
                  <Text variant="bodyLarge">Name:</Text>
                  <Text style={tw`text-lg font-bold`}>Abdul Amos</Text>
                </View> */}
              </View>
              <Button
                mode="contained"
                onPress={handleMakePayment}
                style={tw`w-full rounded-full mt-[20%]`}
                contentStyle={tw`py-2`}
                labelStyle={tw`text-base`}>
                Make Payment
              </Button>
            </View>
          }
        />
      </Fragment>
    );
  };

  return (
    <Screen>
      <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold px-4 pt-5`}>
        Education Payment
      </Text>
      {dynamicContent()}
      <TransactionErrorSheet />
      <PleaseWaitModal visible={isFetching || isProcessing} />
    </Screen>
  );
}
