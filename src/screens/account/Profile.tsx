import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
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

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const SUBLABEL   = "#6B7280";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

const schema = z.object({
  name:  z.string().min(2, "Too Short").trim(),
  email: z.string().email("Please enter a valid email").trim().transform((val) => val.toLowerCase()),
  phone: zodPhoneValidation,
});
type FormValues = z.infer<typeof schema>;

const Profile: React.FC<AccountStackScreenProps<"Profile">> = ({ navigation }) => {
  const insets   = useSafeAreaInsets();
  const [isProcessing, setIsProcessing]         = useState(false);
  const [imageObject, setImageObject]           = useState<Asset | null>(null);
  const [initialImageSource, setInitialImageUri] = useState(require("@assets/draft/male-avatar-circle.png"));

  // ── All original logic — untouched ────────────────────────────────────────
  const user       = useTypedSelector(selectUser);
  const isVerified = useTypedSelector(selectIsAccountVerified);
  const dispatch   = useTypedDispatch();

  const { control, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: user?.name, email: user?.email, phone: user?.phone },
    resolver: zodResolver(schema),
  });

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
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── iOS nav bar (centered title) ── */}
      <View style={s.navBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={s.navCenter}>
          <Text style={s.navTitle}>Personal Information</Text>
          <Text style={s.navSub}>Update your profile details</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollableView contentContainerStyle={s.scroll}>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          <ImageInput
            source={imageObject ?? initialImageSource}
            onChangeImage={(img) => setImageObject(img)}
            onRemoveImage={() => { setImageObject(null); setInitialImageUri(null); }}
          />
        </View>

        {/* Verified banner */}
        {isVerified && (
          <View style={[s.verifiedBanner, IOS_SHADOW]}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#16A34A" />
            <Text style={s.verifiedBannerText}>
              Your account is verified. Some fields cannot be edited.
            </Text>
          </View>
        )}

        {/* Form card */}
        <View style={[s.card, IOS_SHADOW]}>
          <Controller
            control={control} name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomTextInput
                label="Full Name" mode="outlined"
                onBlur={onBlur} value={value} onChangeText={onChange}
                error={!!errors.name} errorMessage={errors.name?.message}
                disabled={isVerified}
              />
            )}
          />
          <Controller
            control={control} name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomTextInput
                label="Email Address" mode="outlined"
                onBlur={onBlur} value={value} onChangeText={onChange}
                disabled={isVerified}
                error={!!errors.email} errorMessage={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control} name="phone"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Phone Number" placeholder="+234 000 000 0000" mode="outlined"
                onBlur={onBlur} value={value} onChangeText={onChange}
                error={!!error} errorMessage={error?.message}
                disabled={isVerified}
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={[s.saveBtn, isProcessing && s.disabledBtn]}
          onPress={onSubmit}
          disabled={isProcessing}
          activeOpacity={0.85}>
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollableView>

      <PleaseWaitModal visible={isProcessing} />
    </View>
  );
};

export default Profile;

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: BG },
  navBar:             { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:            { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:          { flex: 1, alignItems: "center" },
  navTitle:           { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:             { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  scroll:             { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  avatarWrap:         { alignItems: "center", marginBottom: 20 },
  verifiedBanner:     { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F0FDF4", borderRadius: 12, padding: 13, marginBottom: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BBF7D0" },
  verifiedBannerText: { fontSize: 13, color: "#15803D", flex: 1, lineHeight: 18 },
  card:               { backgroundColor: SURFACE, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, padding: 14, marginBottom: 16, gap: 4 },
  saveBtn:            { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  saveBtnText:        { color: SURFACE, fontSize: 15, fontWeight: "700" },
  disabledBtn:        { opacity: 0.6 },
});
