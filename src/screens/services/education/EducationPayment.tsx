import Banner from "@components/ui/banner";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import NairaInput from "@components/ui/form/NairaInput";
import CustomTextInput from "@components/ui/form/TextInput";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { serviceProvidersMap } from "@constants/providers";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { phoneValidation } from "@utils/phone";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Control, Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text, TextInput } from "react-native-paper";
import { verticalScale } from "react-native-size-matters";
import { z } from "zod";

type Props = ServicesStackScreenProps<"Educational Payment">;

type ScreenData = {
  [key: string]: {
    title: string;
    description: string;
    banner?: string;
    inputFields: {
      label: string;
      name: string;
      placeholder?: string;
      options?: {
        label: string;
        id: string;
      }[];
    }[];
  };
};

const jambServiceTypes = [
  { label: "UTME Registration (Price Varies)", id: "utme_registration" },
  { label: "DE Registration (Price Varies)", id: "de_registration" },
  { label: "Full Registration (UTME & DE)", id: "full_registration" },
  { label: "Service (Specify Service)", id: "custom_service" },
];

const imtEnuguServiceTypes = [
  { label: "Undergraduate Admissions", id: "ug_admissions" },
  { label: "Postgraduate Admissions", id: "pg_admissions" },
  { label: "Transcript Processing", id: "transcript_processing" },
  { label: "Certificate Issuance", id: "certificate_issuance" },
  { label: "Course Registration", id: "course_registration" },
  { label: "Student Fee Payment", id: "student_fee_payment" },
];

const educationPaymentScreenData: ScreenData = {
  jamb: {
    title: "Jamb",
    description:
      "Enter the necessary information below to proceed with your payment.",
    banner:
      "SMS NIN, Space your 11 digit NIN number to 55019 or 66019 to get your profile code (e.g NIN 00123456789)",
    inputFields: [
      {
        label: "Service Type",
        name: "service_type",
        options: jambServiceTypes,
        placeholder: "Select Service Type",
      },
      {
        label: "Profile Code",
        name: "profile_code",
        placeholder: "Enter candidate's profile code",
      },
      {
        label: "Phone Number",
        name: "phone",
        placeholder: "Enter Phone Number",
      },
    ],
  },
  ibbu: {
    title: "IBBU",
    description:
      "Enter the necessary information below to proceed with your payment.",

    inputFields: [
      {
        label: "Service Type",
        name: "service_type",
        options: imtEnuguServiceTypes,
        placeholder: "Select Service Type",
      },
      {
        label: "Reference Number",
        name: "reference_number",
        placeholder: "Enter Reference Number",
      },
    ],
  },
  asam: {
    title: "ASAM",
    description:
      "Enter the necessary information below to proceed with your payment.",
    inputFields: [
      {
        label: "Service Type",
        name: "service_type",
      },
      {
        label: "Reference Number",
        name: "reference_number",
        placeholder: "Enter Reference Number",
      },
    ],
  },
};

const schema = {
  jamb: z.object({
    service_type: z.string(),
    profile_code: z.string(),
    phone: z.string(),
    amount: z.string(),
    provider: z.string().default("jamb"),
  }),
  ibbu: z.object({
    service_type: z.string(),
    reference_number: z.string(),
    amount: z.string(),
    provider: z.string().default("ibbu"),
  }),
  asam: z.object({
    service_type: z.string(),
    reference_number: z.string(),
    amount: z.string(),
    provider: z.string().default("asam"),
  }),
};

const generateFormFields = (inputFields: any[], control: Control<any>) => {
  return inputFields.map((field) => {
    if (field.options) {
      return (
        <DropdownMenuField
          key={field.name}
          label={field.label}
          placeholder={field.placeholder}
          name={field.name}
          control={control}
          data={field.options}
        />
      );
    }

    return (
      <Controller
        key={field.name}
        control={control}
        name={field.name}
        render={({ fieldState, field: { onChange, onBlur, value } }) => (
          <CustomTextInput
            label={field.label}
            value={value}
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

export default function EducationPaymentScreen({ route, navigation }: Props) {
  const { provider } = route.params;

  const [fetching, setFetching] = useState(false);

  const { control, handleSubmit, watch, trigger } = useForm({
    resolver: zodResolver(schema[provider as keyof typeof schema]),
    defaultValues: {
      provider,
      service_type: "utme_registration",
      profile_code: "12345678",
      phone: "09121738252",
      amount: "4,500",
    },
  });

  const screenData = useMemo(
    () => educationPaymentScreenData[provider],
    [provider]
  );
  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const values = watch();

  const openBottomSheet = useCallback(() => {
    trigger().then((allGood) => {
      allGood && bottomSheet.current?.present();
    });
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheet.current?.dismiss();
  }, []);

  const handleMakePayment = handleSubmit((values) => {
    console.log(values);
    navigation.navigate("Confirm Transaction", {
      transactionId: "education_payment_" + provider,
    });
    closeBottomSheet();
  });

  return (
    <Screen>
      <ScrollableView style={tw`px-4 pt-10`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          {screenData.title}
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          {screenData.description}
        </Text>
        {screenData.banner && <Banner message={screenData.banner} style={tw`my-5`}/>}
        {generateFormFields(screenData.inputFields, control)}
        <View style={tw`mb-5`}>
          <NairaInput name="amount" control={control} />
          <Text style={tw`text-primary-900 text-sm mt-2.5`}>
            Wallet Balance: ₦20,000.00
          </Text>
        </View>
      </ScrollableView>
      <View style={tw`px-4 pb-4 pt-1`}>
        <Button
          style={tw`w-full rounded-full`}
          contentStyle={tw`py-2`}
          labelStyle={tw`text-white text-center text-base font-bold`}
          disabled={fetching}
          onPress={openBottomSheet}
          mode="contained"
        >
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
                  <Image
                    width={30}
                    source={serviceProvidersMap.education[values.provider].logo}
                  />
                  <Text style={tw`text-lg font-bold`}>
                    {serviceProvidersMap.education[values.provider].label}
                  </Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Amount:</Text>
                <Text style={tw`text-lg font-bold`}>₦{values.amount}</Text>
              </View>
              <View style={tw`flex-row items-center justify-between my-2`}>
                <Text variant="bodyLarge">Name:</Text>
                <Text style={tw`text-lg font-bold`}>Abdul Amos</Text>
              </View>
            </View>
            <Button
              mode="contained"
              onPress={handleMakePayment}
              style={tw`w-full rounded-full mt-[20%]`}
              contentStyle={tw`py-2`}
              labelStyle={tw`text-base`}
            >
              Make Payment
            </Button>
          </View>
        }
      />
    </Screen>
  );
}
