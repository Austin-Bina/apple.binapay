import CustomTextInput from "@components/ui/form/TextInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ManualFundStackScreenProps } from "@navigators/types";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Chip, HelperText, Text, TouchableRipple } from "react-native-paper";
import { vs } from "react-native-size-matters";
import { z } from "zod";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useEffect, useState } from "react";
import { findFileSize, formatBytes, MAXIMUM_FILE_UPLOAD_SIZE, MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES } from "@utils/file";
import API from "@lib/api";
import { showToast } from "@helpers/toast";
import { route as apiRoute } from "@helpers/route";
import { AxiosError } from "axios";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";

type Props = ManualFundStackScreenProps<typeof SCREENS.MANUAL_FUND_PROOF>;

const schema = z.object({
  reference: z.string().trim(),
  account_name: z.string().trim().min(2, "Provide account name"),
  bank: z.string().trim().min(2, "Provide bank name"),
  account_number: z.string().trim().length(10, "Provide account number"),
  proof_of_payment: z.string().trim().min(2, "Upload the receipt of payment"),
});

type FormValues = z.infer<typeof schema>;
const emptyReceiptInfo = {
  fileName: "",
  fileSize: "0 Bytes",
};

export default function ManualFundProofScreen({ route, navigation }: Props) {
  const ref = route.params.reference;

  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState(emptyReceiptInfo);

  const { control, handleSubmit, setValue, setError, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reference: ref,
      account_name: "",
      bank: "",
      account_number: "",
      proof_of_payment: "",
    },
    mode: "onChange",
  });

  const values = watch();

  useEffect(() => {
    if (!ref) {
      navigation.goBack();
    }
  }, [navigation, ref]);

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
      });

      if (!result.canceled) {
        const { uri, size, name } = result.assets[0];
        const allowedSize = MAXIMUM_FILE_UPLOAD_SIZE;
        const allowedSizeInBytes = MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES;
        const formattedSize = formatBytes(size);
        setReceiptInfo({ fileName: name, fileSize: formattedSize });

        if (size && findFileSize(size) <= allowedSize) {
          const receipt = await FileSystem.readAsStringAsync(uri, {
            encoding: "base64",
          });
          setValue("proof_of_payment", receipt);
        } else {
          setError("proof_of_payment", {
            message: `The file is ${formattedSize} which exceeds the allowed limit of ${formatBytes(allowedSizeInBytes)}`,
          });
        }
      }
    } catch (error) {
      showToast({
        message: "Something went wrong. Please try again.",
      });
    }
  };

  const handleRemoveFile = () => {
    reset({ ...values, proof_of_payment: "" });
    setReceiptInfo(emptyReceiptInfo);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsProcessing(true);
      const response = await API.post(apiRoute("funding.uploadProof"), data);
      const { message } = response.data;

      navigation.navigate(SCREENS.MANUAL_FUND_WAIT);
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message, errors } = response.data;

        if (message && typeof message === "string") {
          showToast({ message });
        } else {
          showToast({ message: "Something went wrong. Please try again." });
        }

        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, {
                message: fieldErrors.join(", "),
              });
            }
          }
        }

        if (errors?.proof_of_payment) {
          handleRemoveFile();
        }
      }
    } finally {
      setIsProcessing(false);
    }
  });

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 pt-5 justify-between`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>One last step...</Text>
          <Text style={tw`w-full mb-[30px] text-zinc-500 text-lg font-normal leading-snug`}>
            Kindly upload the receipt of your payment to help us verify this transaction.
          </Text>

          <Controller
            control={control}
            name="account_name"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Sender Account's Name"
                placeholder="e.g John Doe"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="account_number"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Sender Account's Number"
                placeholder="e.g 1234567890"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="bank"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Bank Name"
                placeholder="e.g Opay Nigeria"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="proof_of_payment"
            render={({ field: { value }, fieldState: { error } }) =>
              !value ? (
                <View style={[tw`rounded-lg border border-transparent overflow-hidden mx-auto mt-5`]}>
                  <TouchableRipple onPress={handleSelectFile}>
                    <Image source={require("@assets/images/upload-receipt.png")} background height={vs(150)} />
                  </TouchableRipple>
                  <HelperText type="error" style={tw`text-sm text-center`}>
                    {error?.message}
                  </HelperText>
                </View>
              ) : (
                <View style={[tw`my-5 rounded-lg overflow-hidden mx-auto mt-5 w-[95%]`]}>
                  <Chip
                    onPress={handleRemoveFile}
                    icon="close"
                    mode="flat"
                    selected
                    theme={{ colors: { primary: "red" } }}
                    style={tw`bg-primary-50`}
                    textStyle={tw`text-primary-900`}>
                    Receipt: {receiptInfo.fileName}
                  </Chip>
                  <HelperText type="info">File size: {receiptInfo.fileSize}</HelperText>
                </View>
              )
            }
          />
        </View>
        <View style={tw`pb-4 pt-1`}>
          <Button
            mode="contained"
            onPress={onSubmit}
            disabled={isProcessing}
            contentStyle={tw`py-2`}
            style={tw`w-full rounded-full`}
            labelStyle={tw`text-white text-center text-base font-bold`}>
            Confirm
          </Button>
        </View>
        <PleaseWaitModal visible={isProcessing} />
      </ScrollableView>
    </Screen>
  );
}
