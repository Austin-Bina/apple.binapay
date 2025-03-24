import Banner from "@components/ui/banner";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { showToast } from "@helpers/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { SupportStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { useCreateSupportTicketMutation, useInitiateSupportMutation } from "@store/redux-api/supportApi";
import { selectUser } from "@store/selectors/auth";
import { selectSupportDepartment } from "@store/selectors/support";
import { AxiosError } from "axios";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { Button, Chip, HelperText, Text, TouchableRipple } from "react-native-paper";
import { z } from "zod";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { findFileSize, formatBytes, MAXIMUM_FILE_UPLOAD_SIZE, MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES } from "@utils/file";
import { Image } from "react-native-element-image";
import { vs } from "react-native-size-matters";
import TextInput from "@components/ui/form/TextInput";
import Screen from "@components/ui/shared/Screen";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { truncateString } from "@utils/index";

const schema = z.object({
  description: z.string().min(10, "Please add more context to your message"),
  attachment: z.string().optional(),
});

const emptyReceiptInfo = {
  fileName: "",
  fileSize: "0 Bytes",
};

type FormValues = z.infer<typeof schema>;
export default function StartConversation({ navigation, route }: any) {
  const { departmentId } = route.params;

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState(emptyReceiptInfo);

  const user = useTypedSelector(selectUser);
  const department = useTypedSelector(selectSupportDepartment(departmentId));

  const [createSupportTicket] = useCreateSupportTicketMutation();
  const [initiateSupport] = useInitiateSupportMutation();

  const { control, handleSubmit, setError, setValue, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: route.params?.initialMessage || "",
      attachment: "",
    },
  });

  const values = watch();

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
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
          setValue("attachment", receipt);
        } else {
          setError("attachment", {
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
    reset({ ...values, attachment: "" });
    setReceiptInfo(emptyReceiptInfo);
  };

  const onSubmit = handleSubmit(async function (values) {
    if (!departmentId) {
      showToast({ message: "Please select a department to start a conversation with" });
      navigation.replace(SCREENS.SUPPORT_DEPARTMENT);
      return;
    }

    try {
      setIsProcessing(true);

      const form = {
        ...values,
        department_id: departmentId,
        subject: `${truncateString(values.description, 40)}`,
      };

      // If they have no support_id, register them as a new user
      if (!user?.support_id) {
        await initiateSupport().unwrap();
      }

      const response = await createSupportTicket(form).unwrap();
      const { ticket_id: ticketId } = response;

      if (ticketId) {
        navigation.replace(SCREENS.SUPPORT_CHAT, { ticketId, departmentId });
      }
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message, errors } = response.data;

        if (message && typeof message === "string") {
          showToast({ message });
        }

        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, {
                message: fieldErrors.join(", "),
              });
            }
          }

          if (errors?.attachment) {
            handleRemoveFile();
          }

          return;
        }
      }

      setHasError(true);
    } finally {
      setIsProcessing(false);
    }
  });

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 py-5 justify-between`}>
        <View>
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Start Conversation</Text>
            <Text style={tw`w-full text-gray-500 text-base font-normal leading-snug mt-2`}>
              Start a conversation with our support team to get help with your account.
            </Text>
          </View>
          {hasError && <Banner content="We had trouble starting a conversation. Please try again." />}

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextInput
                label="Start a conversation"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                placeholder="What can we help you with?"
                multiline={true}
                error={!!error}
                style={tw`h-30`}
                errorMessage={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="attachment"
            render={({ field: { value }, fieldState: { error } }) =>
              !value ? (
                <View style={[tw`rounded-lg border border-transparent overflow-hidden mx-auto mt-5`]}>
                  <TouchableRipple onPress={handleSelectFile}>
                    <Image source={require("@assets/images/upload-attachment.png")} background height={vs(150)} />
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
        <Button
          style={tw`mt-auto mb-[30px] w-full rounded-full`}
          contentStyle={tw`p-2`}
          disabled={isProcessing}
          onPress={onSubmit}
          mode="contained">
          <Text style={tw`text-white text-center text-base font-bold`}>Send Message</Text>
        </Button>
      </ScrollableView>
      <PleaseWaitModal visible={isProcessing} />
    </Screen>
  );
}
