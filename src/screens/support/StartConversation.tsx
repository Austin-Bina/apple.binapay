import Banner from "@components/ui/banner";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { showToast } from "@helpers/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupportStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { useCreateSupportTicketMutation, useInitiateSupportMutation } from "@store/redux-api/supportApi";
import { selectUser } from "@store/selectors/auth";
import { selectSupportDepartment } from "@store/selectors/support";
import { AxiosError } from "axios";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { Chip, HelperText, Text, TouchableRipple } from "react-native-paper";
import { z } from "zod";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { findFileSize, formatBytes, MAXIMUM_FILE_UPLOAD_SIZE, MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES } from "@utils/file";
import { Image } from "react-native-element-image";
import { vs } from "react-native-size-matters";
import TextInput from "@components/ui/form/TextInput";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { truncateString } from "@utils/index";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

const schema = z.object({
  description: z.string().min(10, "Please add more context to your message"),
  attachment:  z.string().optional(),
});

const emptyReceiptInfo = { fileName: "", fileSize: "0 Bytes" };
type FormValues = z.infer<typeof schema>;

export default function StartConversation({ navigation, route }: any) {
  const { departmentId } = route.params;
  const insets = useSafeAreaInsets();

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError]         = useState(false);
  const [receiptInfo, setReceiptInfo]   = useState(emptyReceiptInfo);

  const user       = useTypedSelector(selectUser);
  const department = useTypedSelector(selectSupportDepartment(departmentId));

  const [createSupportTicket] = useCreateSupportTicketMutation();
  const [initiateSupport]     = useInitiateSupportMutation();

  const { control, handleSubmit, setError, setValue, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: route.params?.initialMessage || "", attachment: "" },
  });

  const values = watch();

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
      if (!result.canceled) {
        const { uri, size, name } = result.assets[0];
        const formattedSize = formatBytes(size);
        setReceiptInfo({ fileName: name, fileSize: formattedSize });
        if (size && findFileSize(size) <= MAXIMUM_FILE_UPLOAD_SIZE) {
          const receipt = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
          setValue("attachment", receipt);
        } else {
          setError("attachment", {
            message: `File is ${formattedSize}, exceeds limit of ${formatBytes(MAXIMUM_FILE_UPLOAD_SIZE_IN_BYTES)}`,
          });
        }
      }
    } catch {
      showToast({ message: "Something went wrong. Please try again." });
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
      const form = { ...values, department_id: departmentId, subject: `${truncateString(values.description, 40)}` };
      if (!user?.support_id) { await initiateSupport().unwrap(); }
      const response = await createSupportTicket(form).unwrap();
      const { ticket_id: ticketId } = response;
      if (ticketId) { navigation.replace(SCREENS.SUPPORT_CHAT, { ticketId, departmentId }); }
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;
      if (response) {
        const { message, errors } = response.data;
        if (message && typeof message === "string") { showToast({ message }); }
        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, { message: fieldErrors.join(", ") });
            }
          }
          if (errors?.attachment) { handleRemoveFile(); }
          return;
        }
      }
      setHasError(true);
    } finally {
      setIsProcessing(false);
    }
  });

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={[s.header]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>New Conversation</Text>
          <Text style={s.headerSub}>{department?.name ? `${department.name} Team` : "Support Team"}</Text>
        </View>
      </View>

      <ScrollableView contentContainerStyle={s.scroll}>
        {hasError && <Banner content="We had trouble starting a conversation. Please try again." />}

        {/* Info card */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={16} color={BLUE} />
          <Text style={s.infoText}>
            Describe your issue clearly so our team can assist you faster.
          </Text>
        </View>

        {/* Message input */}
        <Text style={s.fieldLabel}>Your Message</Text>
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
              style={s.messageInput}
              errorMessage={error?.message}
            />
          )}
        />

        {/* Attachment */}
        <Text style={[s.fieldLabel, { marginTop: 12 }]}>Attachment (optional)</Text>
        <Controller
          control={control}
          name="attachment"
          render={({ field: { value }, fieldState: { error } }) =>
            !value ? (
              <TouchableOpacity style={s.uploadBox} onPress={handleSelectFile} activeOpacity={0.8}>
                <MaterialCommunityIcons name="paperclip" size={22} color="#9ca3af" />
                <Text style={s.uploadText}>Tap to attach a file or image</Text>
                {error?.message && <Text style={s.uploadError}>{error.message}</Text>}
              </TouchableOpacity>
            ) : (
              <View style={s.attachedChipWrap}>
                <Chip
                  onPress={handleRemoveFile}
                  icon="close"
                  mode="flat"
                  selected
                  theme={{ colors: { primary: "#DC2626" } }}
                  style={s.attachedChip}
                  textStyle={s.attachedChipText}
                >
                  {receiptInfo.fileName}
                </Chip>
                <HelperText type="info" style={s.attachedSize}>
                  File size: {receiptInfo.fileSize}
                </HelperText>
              </View>
            )
          }
        />

        {/* Send button */}
        <TouchableOpacity
          style={[s.sendBtn, isProcessing && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="send" size={16} color="#fff" />
          <Text style={s.sendBtnText}>Send Message</Text>
        </TouchableOpacity>
      </ScrollableView>

      <PleaseWaitModal visible={isProcessing} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#f8f9fb" },
  header:          { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:         { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:     { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:       { fontSize: 11, color: "#6b7280", marginTop: 1 },

  scroll:          { padding: 16, paddingBottom: 40 },

  infoCard:        { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 12, marginBottom: 16 },
  infoText:        { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },

  fieldLabel:      { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 },
  messageInput:    { minHeight: 120 },

  uploadBox:       { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "dashed", padding: 16, marginBottom: 8 },
  uploadText:      { fontSize: 13, color: "#9ca3af" },
  uploadError:     { fontSize: 12, color: "#DC2626", marginTop: 4 },

  attachedChipWrap:{ marginBottom: 8 },
  attachedChip:    { backgroundColor: "#FEF2F2" },
  attachedChipText:{ color: "#991B1B" },
  attachedSize:    { fontSize: 11 },

  sendBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BLUE, borderRadius: 12, paddingVertical: 15, marginTop: 16 },
  sendBtnText:     { color: "#fff", fontSize: 15, fontWeight: "700" },
});
