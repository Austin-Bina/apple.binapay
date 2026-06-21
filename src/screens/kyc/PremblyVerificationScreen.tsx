import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { authSliceActions } from "@store/slice/auth";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import API from "@lib/api";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import { WebView } from "react-native-webview";


const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.PREMBLY_VERIFICATION>;

export default function PremblyVerificationScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const user     = useTypedSelector(selectUser);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showWidget, setShowWidget] = React.useState(false);

  const handleVerified = async (data: any) => {
  try {
    console.log("PREMBLY FULL RESPONSE:", JSON.stringify(data, null, 2));
    setIsLoading(true);

    const premblyRef = data?.data?.reference ?? "prembly_" + Date.now();
    const userData = data?.data?.user_data ?? {};

    const verificationType: "bvn" | "nin" =
      userData?.bvn ? "bvn" : "nin";

    const documentNumber = userData?.bvn ?? userData?.nin ?? userData?.id_number ?? "";

    const verifiedName = userData?.full_name ??
      (`${userData?.first_name ?? ""} ${userData?.last_name ?? ""}`.trim() || undefined);

    if (!documentNumber) {
      showToast({ variant: "error", message: "Could not extract ID number. Please try again." });
      setShowWidget(false);
      return;
    }

    const payload: any = {
      verification_type: verificationType,
      prembly_ref: premblyRef,
      ...(verifiedName && { verified_name: verifiedName }),
    };
    if (verificationType === "bvn") payload.bvn = documentNumber;
    else payload.nin = documentNumber;

    const response = await API.post("/api/v1/kyc/prembly-callback", payload);
    dispatch(authSliceActions.updateUser(response.data.user));
    await dispatch(authSliceActions.fetchUserProfile());
    navigation.navigate(SCREENS.VERIFICATION_SUCCESS, { tier: 1 });

  } catch (error: any) {
    showToast({
      variant: "error",
      message: error?.response?.data?.message ?? "Verification failed. Please try again.",
    });
    setShowWidget(false);
  } finally {
    setIsLoading(false);
  }
};

 

// ── Widget active: render full screen ────────────────────────────────
if (showWidget) {
  const widgetUrl = 
  `https://mobile.prembly.com/v2/?` +
  `widgetKey=wdgt_724459dca876421fbe926d55f6de4c1f` +
  `&configId=b1304d3c-627a-4c16-81f4-0cba8f29bc0d` +
  `&merchantKey=live_pk_5638af43a940463eb99230b784d1d2f0` +
  `&merchant_key=live_pk_5638af43a940463eb99230b784d1d2f0` +
  `&config_id=b1304d3c-627a-4c16-81f4-0cba8f29bc0d` +
  `&firstName=${encodeURIComponent(user?.name?.split(" ")[0] ?? "")}` +
  `&lastName=${encodeURIComponent(user?.name?.split(" ").slice(1).join(" ") ?? "")}` +
  `&email=${encodeURIComponent(user?.email ?? "")}` +
  `&userRef=${encodeURIComponent(String(user?.id ?? ""))}` +
  `&user_ref=${encodeURIComponent(String(user?.id ?? ""))}`;

  return (
    <View style={s.root}>
      <WebView
  style={{ flex: 1 }}
  source={{ uri: widgetUrl }}
  javaScriptEnabled={true}
  allowsInlineMediaPlayback={true}
  mediaPlaybackRequiresUserAction={false}
  domStorageEnabled={true}
  allowsFullscreenVideo={true}
  mixedContentMode="always"
  originWhitelist={["*"]}
  userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
  onMessage={(e) => {
    console.log("RAW PREMBLY MESSAGE:", e.nativeEvent.data);
    try {
      const response = JSON.parse(e.nativeEvent.data);
      console.log("PREMBLY MESSAGE:", JSON.stringify(response, null, 2));
      if (response.event === "verified") {
        handleVerified({ status: "success", data: response });
      } else if (response.event === "error") {
        showToast({ variant: "error", message: response.message ?? "Verification failed." });
        setShowWidget(false);
      } else if (response.event === "closed") {
        setShowWidget(false);
      }
    } catch (e) {}
  }}
  onLoadStart={() => console.log("Widget loading...")}
  onLoadEnd={() => console.log("Widget loaded")}
  onError={(e) => {
    console.log("WebView error:", e.nativeEvent);
    showToast({ variant: "error", message: "Could not load verification widget." });
    setShowWidget(false);
  }}
/>
    </View>
  );
}

  // ── Intro screen ─────────────────────────────────────────────────────
  return (
    <View style={[s.root]}>
      <ScreenHeader
      title="Identity Verification"
      subtitle="Secure your account"
      onBack={() => navigation.goBack()}
      />

      <View style={s.body}>
        <View style={s.illustrationWrap}>
          <View style={s.illustration}>
            <MaterialCommunityIcons name="shield-account-outline" size={72} color={BLUE} />
          </View>
          <View style={s.ring} />
        </View>

        <Text style={s.title}>Verify Your Identity</Text>
        <Text style={s.subtitle}>
          We'll guide you through selecting and verifying your ID. The process takes less than 2 minutes.
        </Text>

        <View style={s.steps}>
          {[
            "Choose your ID type (BVN or NIN)",
            "Enter your ID number",
            "Take a quick selfie to confirm it's you",
          ].map((step) => (
            <View key={step} style={s.stepRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#16a34a" />
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.btn, isLoading && s.btnDisabled]}
          onPress={() => setShowWidget(true)}
          disabled={isLoading}
        >
          <Text style={s.btnText}>{isLoading ? "Processing..." : "Start Verification"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#fff" },
  header:           { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:          { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:      { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:        { fontSize: 12, color: "#6b7280" },
  body:             { flex: 1, padding: 24, alignItems: "center" },
  illustrationWrap: { position: "relative", marginTop: 20, marginBottom: 32 },
  illustration:     { width: 160, height: 160, borderRadius: 80, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  ring:             { position: "absolute", width: 172, height: 172, borderRadius: 86, borderWidth: 3, borderColor: BLUE, borderStyle: "dashed", top: -6, left: -6 },
  title:            { fontSize: 22, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8 },
          subtitle:         { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 28 },
  steps:            { width: "100%", gap: 14 },
  stepRow:          { flexDirection: "row", alignItems: "center", gap: 10 },
  stepText:         { fontSize: 14, color: "#374151" },
  footer:           { paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  btn:              { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  btnDisabled:      { opacity: 0.5 },
  btnText:          { fontSize: 16, fontWeight: "700", color: "#fff" },
});
