import Banner from "@components/ui/banner";
import EducationEmptyState from "@components/ui/empty-states/education";
import EducationErrorState from "@components/ui/error-states/education";
import CustomButton from "@components/ui/form/button";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import NairaInput from "@components/ui/form/NairaInput";
import CustomTextInput from "@components/ui/form/TextInput";
import WalletBalanceHelper from "@components/ui/form/wallet-balance";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import BottomSheetModal from "@components/ui/modals/preview-transaction";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import { TransactionForm } from "@enum/transaction";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWalletBalanceValidation } from "@hooks/transaction";
import tw from "@lib/tailwind";
import { EducationStackScreenProps } from "@navigators/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { useGetEducationPlansQuery, useGetEducationServiceDetailsQuery } from "@store/redux-api/utilityBillsQueryApi";
import { selectUser } from "@store/selectors/auth";
import { selectSystemSettings } from "@store/selectors/settings";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { calculateTransactionDetails, zodAmountValidation } from "@utils/money";
import { getNavigate } from "@utils/navigation";
import { zodPhoneValidation } from "@utils/phone";
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { RefreshControl, View } from "react-native";
import { Text } from "react-native-paper";
import { z } from "zod";

type Props = EducationStackScreenProps<"Educational Payment">;

const schema = z.object({
  provider: z.string(),
  variation_code: z.string(),
  amount: zodAmountValidation(1),
  quantity: z
    .string()
    .transform((val) => {
      const numericValue = parseInt(val);
      return `${numericValue}`;
    })
    .refine(
      (val) => {
        const num = parseInt(val);
        return num > 0;
      },
      {
        message: "Quantity must be greater than 0",
      },
    ),
  phone: zodPhoneValidation,
  product_name: z.string(),
  profile_code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type InitialQuantityAmounts = Map<string, string>;

export default function EducationPaymentScreen({ route }: Props) {
  const { provider } = route.params;

  const [initialQuantityAmounts, setInitialQuantityAmounts] = useState<InitialQuantityAmounts>(new Map());

  const queryConfig = useMemo(
    () => ({
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
      skip: !provider,
    }),
    [provider],
  );

  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const user = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();
  const { customers } = useTypedSelector(selectSystemSettings);
  const prefetchSystemSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });
  const { data: educationPlans } = useGetEducationPlansQuery(undefined, queryConfig);
  const {
    data: queryData,
    isFetching,
    error,
    refetch,
  } = useGetEducationServiceDetailsQuery(
    {
      service_id: provider,
    },
    queryConfig,
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

  const values = watch();
  const screenData = queryData;

  const educationPlan = useMemo(
    () => educationPlans?.education_plans.find((plan) => plan.serviceId === provider),
    [provider, educationPlans],
  );

  useEffect(() => {
    prefetchSystemSettings();
  }, []);

  // When quantity changes, update the amount
  useEffect(() => {
    const quantity = parseInt(values.quantity);
    const initialQuantityAmount = initialQuantityAmounts.get(values.variation_code);

    if (quantity && !isNaN(quantity) && initialQuantityAmount) {
      const amount = quantity * Number.parseFloat(initialQuantityAmount);
      setValue("amount", String(amount), { shouldDirty: true });
    }
  }, [values.quantity, values.variation_code]);

  // Set the initial quantity amounts
  useEffect(() => {
    const initialQuantityAmounts: InitialQuantityAmounts = new Map();
    const fields = screenData?.inputFields;

    if (fields) {
      fields.forEach((field) => {
        // Best check if it is the select field
        if (field.name === "variation_code" && field.options && Array.isArray(field.options)) {
          field.options.forEach((option) => {
            initialQuantityAmounts.set(option.variation_code, option.variation_amount);
          });
        }
      });

      setInitialQuantityAmounts(initialQuantityAmounts);
    }
  }, [screenData]);

  const walletValidation = useWalletBalanceValidation({
    amount: parseFloat(values.amount) || 0,
  });

  const extraPlanDetails = useMemo(() => {
    return calculateTransactionDetails(parseFloat(values.amount) || 0, "education", customers);
  }, [values.amount, customers]);

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
      // Best check if it is the select field
      if (field.name === "variation_code" && field.options && Array.isArray(field.options)) {
        const options = field.options.map((option) => ({
          ...option,
          label: option.name,
          id: option.variation_code,
        }));

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

    const transactionDetails = [
      {
        label: "Product Name",
        value: educationPlan.name,
        icon: educationPlan.logo,
      },
      { label: "No of Candidates", value: values.quantity },
      ...Object.keys(extraPlanDetails).map((key) => ({ label: key, value: extraPlanDetails[key] })),
    ];

    return (
      <Fragment>
        <ScrollableView
          contentContainerStyle={tw`px-4 py-5 justify-between`}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
          <View>
            <Text variant="titleMedium" style={tw`text-gray-800 mb-2 font-bold`}>
              {screenData.title}
            </Text>
            <Text variant="bodySmall" style={tw`text-gray-500`}>
              {screenData.description}
            </Text>
            {screenData.banner && <Banner content={screenData.banner} style={tw`my-5`} />}
            {generateFormFields()}
            <View style={tw`mb-5`}>
              <NairaInput name="amount" control={control} isDisabled />
              <WalletBalanceHelper {...walletValidation} />
            </View>
          </View>
          <View style={tw`pb-4 pt-1`}>
            <CustomButton disabled={!walletValidation.canPay} onPress={openBottomSheet}>
              Continue
            </CustomButton>
          </View>
        </ScrollableView>
        <BottomSheetModal
          ref={bottomSheet}
          title="Confirm Bill Payment"
          details={transactionDetails}
          buttonLabel="Make Payment"
          onConfirm={handleMakePayment}
          onDismiss={closeBottomSheet}
          snapPoints={["50%", "50%"]}
          disabled={!walletValidation.canPay}
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
      <PleaseWaitModal visible={isFetching} />
    </Screen>
  );
}
