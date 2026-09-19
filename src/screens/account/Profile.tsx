import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Button, Text } from "react-native-paper";
import { AccountStackScreenProps } from "@navigators/types";
import { Controller, useForm } from "react-hook-form";
import CustomTextInput from "@components/ui/form/TextInput";
import ScrollableView from "@components/ui/shared/ScrollableView";
import ImageInput from "@components/ui/shared/ImageInput";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { Asset } from "react-native-image-picker";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { selectIsAccountVerified, selectUser } from "@store/selectors/auth";
import API from "@lib/api";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import { authSliceActions } from "@store/slice/auth";
import { AxiosError } from "axios";
import { getNavigate } from "@utils/navigation";
import { zodPhoneValidation } from "@utils/phone";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import Toast, { type ToastOptions } from "react-native-root-toast"

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

const schema = z.object({
  name:  z.string().min(2, "Too Short").trim(),
  email: z.string().email("Please enter a valid email").trim().transform((val) => val.toLowerCase()),
  phone: zodPhoneValidation,
});
type FormValues = z.infer<typeof schema>;

type DeleteErrors = {
  password?: string;
  transaction_pin?: string;
  account?: string;
};

const Profile: React.FC<AccountStackScreenProps<"Profile">> = ({ navigation }) => {
  const insets     = useSafeAreaInsets();
  const [isProcessing, setIsProcessing]   = useState(false);
  const [imageObject, setImageObject]     = useState<Asset | null>(null);
  const [initialImageSource, setInitialImageUri] = useState(require("@assets/draft/male-avatar-circle.png"));

  const user       = useTypedSelector(selectUser);
  const isVerified = useTypedSelector(selectIsAccountVerified);
  const dispatch   = useTypedDispatch();

  const { control, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: user?.name, email: user?.email, phone: user?.phone },
    resolver: zodResolver(schema),
  });

  // ── Delete account state ──────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword]   = useState("");
  const [deletePin, setDeletePin]             = useState("");
  const [deleteReason, setDeleteReason]       = useState("");
  const [isDeleting, setIsDeleting]           = useState(false);
  const [deleteErrors, setDeleteErrors]       = useState<DeleteErrors>({});

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletePassword("");
    setDeletePin("");
    setDeleteReason("");
    setDeleteErrors({});
  };

  const handleDeleteAccount = async () => {
    setDeleteErrors({});

    if (!deletePassword) {
      setDeleteErrors({ password: "Password is required." });
      return;
    }
    if (!deletePin) {
      setDeleteErrors({ transaction_pin: "Transaction PIN is required." });
      return;
    }

    setIsDeleting(true);
    try {
      await API.post(route("account.delete"), {
        password: deletePassword,
        transaction_pin: deletePin,
        reason: deleteReason.trim() || undefined,
      });

      dispatch(authSliceActions.logout());
      const { reset } = await getNavigate();
      reset({ routes: [{ name: "Auth", params: { screen: "Login" } }] });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message, errors: fieldErrors } = response.data ?? {};

        if (fieldErrors) {
          const mapped: DeleteErrors = {};
          for (const [field, msgs] of Object.entries(fieldErrors)) {
            const text = Array.isArray(msgs) ? msgs.join(", ") : String(msgs);
            if (field === "password" || field === "transaction_pin" || field === "account") {
              mapped[field as keyof DeleteErrors] = text;
            }
          }
          setDeleteErrors(mapped);
          const firstMessage = Object.values(mapped)[0];
          if (firstMessage) showToast({ message: firstMessage });
        } else {
          showToast({ message: message || "Could not delete account. Please try again.", position: Toast.positions.TOP });
        }
      } else {
        showToast({ message: "Could not delete account. Please try again.", position: Toast.positions.TOP });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const result = zodPhoneValidation.safeParse(values.phone);
    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      setError("phone", { message: errorMessage });
      return showToast({ message: errorMessage });
    }
    setIsProcessing(true);
    try {
      const response = await API.post(route("account.updateProfile"), values);
      dispatch(authSliceActions.updateUser(response.data.user));
      const { reset } = await getNavigate();
      reset({ routes: [{ name: "Home", params: { screen: "Dashboard" } }] });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;
      if (response) {
        const { message, errors } = response.data;
        showToast({ message: message || "Something went wrong. Please try again." });
        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, { message: fieldErrors.join(", ") });
            }
          }
        }
      } else {
        showToast({ message: "Something went wrong. Please try again." });
      }
    } finally {
      setIsProcessing(false);
    }
  });

  return (
    <View style={s.root}>
      {/* Header */}
      <ScreenHeader
          title="Personal Information"
          subtitle="Update your profile details"
          onBack={() => navigation.goBack()}
          rightIcon="shield-check-outline"
        />

      <ScrollableView contentContainerStyle={s.scroll}>
        {/* Avatar */}
        <View style={s.avatarWrap}>
          <ImageInput
            source={imageObject ?? initialImageSource}
            onChangeImage={(img) => setImageObject(img)}
            onRemoveImage={() => { setImageObject(null); setInitialImageUri(null); }}
          />
        </View>

        {isVerified && (
          <View style={s.verifiedBanner}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#16a34a" />
            <Text style={s.verifiedBannerText}>Your account is verified. Some fields cannot be edited.</Text>
          </View>
        )}

        <View style={s.card}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomTextInput
                label="Full Name"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!errors.name}
                errorMessage={errors.name?.message}
                disabled={isVerified}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomTextInput
                label="Email Address"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                disabled={isVerified}
                error={!!errors.email}
                errorMessage={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Phone Number"
                placeholder="+234 000 000 0000"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
                disabled={isVerified}
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={[s.saveBtn, isProcessing && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() => setShowDeleteModal(true)}
          activeOpacity={0.85}
        >
          <Text style={s.deleteBtnText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollableView>

      <PleaseWaitModal visible={isProcessing} />

      {/* ── Delete account modal ── */}
      <Modal visible={showDeleteModal} transparent animationType="slide" onRequestClose={resetDeleteModal}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={s.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
              
                <View style={s.modalCard}>
                  <Text style={s.modalTitle}>Delete Account</Text>
                  <Text style={s.modalHint}>
                    This permanently deletes your account. Any remaining wallet balance must be
                    withdrawn first. Enter your password and transaction PIN to confirm.
                  </Text>

                  {deleteErrors.account && (
                    <View style={s.deleteWarningBox}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#B91C1C" />
                      <Text style={s.deleteWarningText}>{deleteErrors.account}</Text>
                    </View>
                  )}

                  <CustomTextInput
                    label="Password"
                    mode="outlined"
                    secureTextEntry
                    value={deletePassword}
                    onChangeText={(val) => {
                      setDeletePassword(val);
                      if (deleteErrors.password) setDeleteErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    error={!!deleteErrors.password}
                    errorMessage={deleteErrors.password}
                  />

                  <CustomTextInput
                    label="Transaction PIN"
                    mode="outlined"
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={4}
                    value={deletePin}
                    onChangeText={(val) => {
                      setDeletePin(val);
                      if (deleteErrors.transaction_pin) setDeleteErrors((prev) => ({ ...prev, transaction_pin: undefined }));
                    }}
                    error={!!deleteErrors.transaction_pin}
                    errorMessage={deleteErrors.transaction_pin}
                  />

                  <CustomTextInput
                    label="Reason (optional)"
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    placeholder="Help us improve — why are you leaving?"
                    value={deleteReason}
                    onChangeText={setDeleteReason}
                    style={{ minHeight: 70, textAlignVertical: "top" }}
                  />

                  <View style={s.modalActions}>
                    <Button
                      mode="outlined"
                      style={s.modalCancelBtn}
                      onPress={resetDeleteModal}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      buttonColor="#dc2626"
                      style={s.modalDeleteBtn}
                      loading={isDeleting}
                      disabled={isDeleting}
                      onPress={handleDeleteAccount}
                    >
                      Delete
                    </Button>
                  </View>
                </View>
              
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default Profile;

const s = StyleSheet.create({
  root:                { flex: 1, backgroundColor: "#f8f9fb" },
  header:              { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:             { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:         { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:           { fontSize: 11, color: "#6b7280", marginTop: 1 },
  scroll:              { padding: 16, paddingBottom: 40 },
  avatarWrap:          { alignItems: "center", marginBottom: 16 },
  verifiedBanner:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "#bbf7d0" },
  verifiedBannerText:  { fontSize: 12, color: "#15803d", flex: 1 },
  card:                { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", padding: 14, marginBottom: 16, gap: 4 },
  saveBtn:             { backgroundColor: BLUE, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  saveBtnText:         { color: "#fff", fontSize: 15, fontWeight: "700" },
  deleteBtn:           { marginTop: 12, alignItems: "center", paddingVertical: 12 },
  deleteBtnText:       { color: "#dc2626", fontSize: 14, fontWeight: "600" },

  // Delete modal
  modalOverlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard:           { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalTitle:          { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 2 },
  modalHint:           { fontSize: 12, color: "#888", lineHeight: 18, marginBottom: 4 },
  modalActions:        { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelBtn:       { flex: 1, borderRadius: 30, borderColor: "#D0D9EE" },
  modalDeleteBtn:       { flex: 1.5, borderRadius: 30 },
  deleteWarningBox:     { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "#FEF2F2", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#FECACA" },
  deleteWarningText:    { flex: 1, fontSize: 12, color: "#B91C1C", lineHeight: 17 },
});
