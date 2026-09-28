import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, KeyboardAvoidingView, Keyboard, Platform, Modal
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import API from "@lib/api";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import * as WebBrowser from "expo-web-browser";
//import { WebView } from "react-native-webview";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.PREMBLY_VERIFICATION>;

export default function PremblyVerificationScreen({ navigation, route }: Props) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const idType = route.params.idType;

  const [isLoading, setIsLoading]   = React.useState(false);
  const [idNumber, setIdNumber]     = React.useState("");
  const [webViewUrl, setWebViewUrl] = React.useState<string | null>(null);
  const sessionIdRef                = React.useRef<string | null>(null);

  const isValid = idNumber.length === 11 && /^\d{11}$/.test(idNumber);

  const handleIdChange = (text: string) => {
    setIdNumber(text);
    if (text.length === 11) Keyboard.dismiss();
  };

 const [errorModal, setErrorModal] = React.useState<{
  visible: boolean;
  title: string;
  message: string;
  fallbackUrl: string | null;
}>({
  visible: false,
  title: "",
  message: "",
  fallbackUrl: null,
});

  const showError = (
  title: string,
  message: string,
  fallbackUrl?: string | null
) => {
  setErrorModal({
    visible: true,
    title,
    message,
    fallbackUrl: fallbackUrl ?? null,
  });
};

  const handleStartVerification = async () => {
    if (!isValid) {
      showToast({ variant: "error", message: "Please enter a valid 11-digit number." });
      return;
    }
    let currentFallbackUrl: string | null = null;
    try {
      setIsLoading(true);

      const response = await API.post("/api/v1/kyc/prembly-initiate", {
        id_type:   idType,
        id_number: idNumber,
      });

      const sessionId = response.data?.data?.session_id;
      if (!sessionId) {
        showToast({ variant: "error", message: "Could not start verification. Please try again." });
        return;
      }

      const url = `https://sdk-live.prembly.com/?session=${encodeURIComponent(sessionId)}`;
      currentFallbackUrl = url;
      // WebBrowser (working — kept as fallback)
       await WebBrowser.openBrowserAsync(url);
       try {
         await API.post("/api/v1/kyc/prembly-callback", { session_id: sessionId });
       } catch (e) {}
      await dispatch(authSliceActions.fetchUserProfile());
       const sessionResult = await API.post("/api/v1/kyc/prembly-session-status", { session_id: sessionId });
      const sessionStatus = sessionResult.data;

      if (idType === "nin") {
  // NIN verification does NOT require face verification.
  if (sessionStatus.id_verified) {
    navigation.navigate(SCREENS.VERIFICATION_SUCCESS, {
      tier: 2,
    });
  } else {
    showError(
      "NIN Verification Failed",
      "Your NIN could not be verified. Please ensure you entered the correct NIN and try again."
    );
  }

  return;
}

// BVN verification requires both ID verification and face verification.
if (sessionStatus.face_verified && sessionStatus.id_verified) {
  navigation.navigate(SCREENS.VERIFICATION_SUCCESS, {
    tier: 1,
  });
} else if (sessionStatus.face_verified && !sessionStatus.id_verified) {
  showError(
    "BVN Verification Failed",
    "Your face scan passed but your BVN could not be verified. Please ensure you entered the correct BVN and try again."
  );
} else {
  showError(
    "Face Verification Failed",
    "We could not verify your face. Please ensure you are in a well-lit environment, remove glasses if any, and look directly at the camera."
  );
}

      // WebView
     // sessionIdRef.current = sessionId;
      //setWebViewUrl(url);
      //setIsLoading(false);

    } catch (error: any) {
      const msg = error?.response?.data?.message ?? "Failed to start verification.";
      showError("Verification Error", msg,  currentFallbackUrl);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader
        title="Identity Verification"
        subtitle="Secure your account"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration */}
        <View style={s.illustrationWrap}>
          <View style={s.illustration}>
            <MaterialCommunityIcons name="shield-account-outline" size={64} color={BLUE} />
          </View>
          <View style={s.ring} />
        </View>

        <Text style={s.title}>
          Verify Your {idType === "bvn" ? "BVN" : "NIN"}
         </Text>

        <Text style={s.subtitle}>
         Enter your {idType === "bvn" ? "BVN" : "NIN"} below.{" "}
          {idType === "bvn"
          ? "We'll verify it before opening the secure face scan."
          : "We'll verify your NIN securely."}
         </Text>

       

        {/* Number input */}
        <Text style={s.label}>
          {idType === "bvn" ? "BVN Number" : "NIN Number"}
        </Text>
        <View style={s.inputWrap}>
          <MaterialCommunityIcons
            name={idType === "bvn" ? "bank-outline" : "card-account-details-outline"}
            size={20}
            color={idNumber.length > 0 ? BLUE : "#9ca3af"}
            style={s.inputIcon}
          />
          <TextInput
            style={s.input}
            placeholder={`Enter your 11-digit ${idType.toUpperCase()}`}
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            maxLength={11}
            value={idNumber}
            onChangeText={handleIdChange}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
          {idNumber.length === 11 && (
            <MaterialCommunityIcons
              name={isValid ? "check-circle" : "close-circle"}
              size={20}
              color={isValid ? "#16a34a" : "#ef4444"}
            />
          )}
        </View>
        <Text style={s.hint}>
          {idType === "bvn" ? "Dial *565*0# to get your BVN" : "Dial *346# to get your NIN"}
        </Text>

        {/* Steps */}
        <View style={s.stepsCard}>
          <Text style={s.stepsTitle}>What happens next</Text>
          {[
            { icon: "numeric-1-circle-outline", text: "We verify your number is unique and valid" },
            { icon: "numeric-2-circle-outline", text: "Secure face scan opens automatically" },
            { icon: "numeric-3-circle-outline", text: "Verification completes instantly" },
          ].map((step) => (
            <View key={step.text} style={s.stepRow}>
              <MaterialCommunityIcons name={step.icon as any} size={20} color={BLUE} />
              <Text style={s.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Security note */}
        <View style={s.securityNote}>
          <MaterialCommunityIcons name="lock-outline" size={16} color="#6b7280" />
          <Text style={s.securityText}>
            Your information is encrypted and never stored in plain text.
          </Text>
        </View>
      </ScrollView>

      {/* Footer button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.btn, (!isValid || isLoading) && s.btnDisabled]}
          onPress={handleStartVerification}
          disabled={!isValid || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={s.btnInner}>
              <MaterialCommunityIcons name="loading" size={20} color="#fff" />
              <Text style={s.btnText}>Checking...</Text>
            </View>
          ) : (
            <View style={s.btnInner}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color="#fff" />
              <Text style={s.btnText}>
            {idType === "bvn" ? "Continue to Face Scan" : "Continue to Verification"}
               </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* WebView Modal */}
      {webViewUrl && (
        <Modal visible animationType="slide">
          <View style={{ flex: 1, paddingTop: insets.top }}>
            <TouchableOpacity
              style={{ padding: 16 }}
              onPress={() => { setWebViewUrl(null); setIsLoading(false); }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#111" />
            </TouchableOpacity>
  
          </View>
        </Modal>
      )}

      {/* Error Modal */}
      <Modal
        visible={errorModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModal(e => ({ ...e, visible: false }))}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalIconWrap}>
              <MaterialCommunityIcons name="emoticon-sad-outline" size={36} color="#ef4444" />
            </View>
            <Text style={s.modalTitle}>{errorModal.title}</Text>
            <Text style={s.modalMessage}>{errorModal.message}</Text>


            {errorModal.fallbackUrl && (
  <TouchableOpacity
    style={s.modalBtn}
    onPress={async () => {
      try {
        await WebBrowser.openBrowserAsync(
          errorModal.fallbackUrl!
        );
      } catch {
        showToast({
          variant: "error",
          message: "Could not open the verification link.",
        });
      }
    }}
    activeOpacity={0.85}
  >
    <MaterialCommunityIcons
      name="open-in-new"
      size={19}
      color="#fff"
    />

    <Text style={s.modalBtnText}>
      Open Verification in Browser
    </Text>
  </TouchableOpacity>
)}

<TouchableOpacity
  style={s.modalSecondaryBtn}
  onPress={() =>
    setErrorModal(e => ({
      ...e,
      visible: false,
    }))
  }
  activeOpacity={0.85}
>
  <Text style={s.modalSecondaryBtnText}>
    Try Again
  </Text>
</TouchableOpacity>

          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#fff" },
  scroll:           { padding: 24, paddingBottom: 16 },

  illustrationWrap: { position: "relative", alignSelf: "center", marginTop: 8, marginBottom: 24 },
  illustration:     { width: 120, height: 120, borderRadius: 60, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  ring:             { position: "absolute", width: 132, height: 132, borderRadius: 66, borderWidth: 2.5, borderColor: BLUE, borderStyle: "dashed", top: -6, left: -6 },

  title:            { fontSize: 20, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8 },
  subtitle:         { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 24, lineHeight: 22 },

  label:            { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },


  inputWrap:        { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#fff", marginBottom: 8 },
  inputIcon:        { marginRight: 10 },
  input:            { flex: 1, paddingVertical: 14, fontSize: 17, color: "#111827", letterSpacing: 3 },
  hint:             { fontSize: 12, color: "#9ca3af", marginBottom: 20 },

  stepsCard:        { backgroundColor: "#f8f9fb", borderRadius: 14, padding: 16, marginBottom: 16, gap: 12 },
  stepsTitle:       { fontSize: 13, fontWeight: "700", color: BRAND, marginBottom: 4 },
  stepRow:          { flexDirection: "row", alignItems: "center", gap: 10 },
  stepText:         { fontSize: 13, color: "#374151", flex: 1 },

  securityNote:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f9fafb", borderRadius: 10, padding: 12 },
  securityText:     { fontSize: 12, color: "#6b7280", flex: 1 },

  footer:           { paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  btn:              { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  btnDisabled:      { opacity: 0.45 },
  btnInner:         { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText:          { fontSize: 16, fontWeight: "700", color: "#fff" },

  modalOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard:        { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, alignItems: "center", paddingBottom: 40 },
  modalIconWrap:    { width: 72, height: 72, borderRadius: 36, backgroundColor: "#fef2f2", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  modalTitle:       { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 10, textAlign: "center" },
  modalMessage:     { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  //modalBtn:         { width: "100%", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  modalBtnText:     { fontSize: 16, fontWeight: "700", color: "#fff" },
  modalBtn: {
  width: "100%",
  backgroundColor: BLUE,
  paddingVertical: 15,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: 8,
},

modalSecondaryBtn: {
  width: "100%",
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: "center",
  marginTop: 10,
  backgroundColor: "#f3f4f6",
},

modalSecondaryBtnText: {
  fontSize: 15,
  fontWeight: "700",
  color: "#374151",
},
});
