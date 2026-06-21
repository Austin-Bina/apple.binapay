import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
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

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

const schema = z.object({
  name:  z.string().min(2, "Too Short").trim(),
  email: z.string().email("Please enter a valid email").trim().transform((val) => val.toLowerCase()),
  phone: zodPhoneValidation,
});
type FormValues = z.infer<typeof schema>;

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
      </ScrollableView>

      <PleaseWaitModal visible={isProcessing} />
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
});
