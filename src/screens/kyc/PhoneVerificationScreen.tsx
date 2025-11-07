import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import axios from "axios";
import { routes } from "@constants/routes"; 
import { getNavigate } from "@utils/navigation";
import { SCREENS } from "@constants/screens";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KYCParamList } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { selectIsBvnVerified, selectIsNinVerified } from "@store/selectors/auth";
import API from "@lib/api";

type Props = NativeStackScreenProps<KYCParamList, typeof SCREENS.PHONE_VERIFICATION>;

export default function PhoneVerificationScreen({ navigation }: Props) {
  const user = useTypedSelector(selectUser); // read user from Redux
   const isBvnVerified = useTypedSelector(selectIsBvnVerified);
  const isNinVerified = useTypedSelector(selectIsNinVerified) || isBvnVerified;
const [tempVerified, setTempVerified] = useState(false);

  const [phone, setPhone] = useState(user?.phone || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

const verified = Boolean(user?.phone_verified_at) || tempVerified;

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    title: string;
    description: string;
  } | null>(null);

  // Auto hide alert after 8s
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const showAlert = (type: "success" | "error" | "warning", title: string, description: string) => {
    setAlert({ type, title, description });
  };

      const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  const handleVerify = async () => {
    if (!phone) {
      showAlert("warning", "Missing Phone", "Please enter your phone number before verification.");
      return;
    }

    setLoading(true);
    try {
          API.defaults.baseURL = BASE_URL;
      
      if (!otp) {
        // Step 1: Request OTP
        const res = await API.post(routes.api.v1.auth.phonenotp, { phone });

        showAlert("success", "OTP Sent", "Your OTP has been sent to your phone. Enter it below.");
      } else {
        // Step 2: Verify OTP
         const res = await API.post(routes.api.v1.auth.verifyphoneotp, { otp });

        showAlert("success", "Phone Verified", "Your phone number has been verified successfully.");

         // ✅ Temporarily mark phone as verified for UI
      setTempVerified(true);

      // Optionally clear the OTP input
      setOtp("");
      }
    } catch (error: any) {
      showAlert(
        "error",
        "Failed",
        error.response?.data?.message || "Verification failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const { navigate } = await getNavigate();
    navigate(SCREENS.MAIN, {
      screen: SCREENS.MENU,
      params: {
        screen: SCREENS.VERIFY_ACCOUNT,
        params: {
          screen: SCREENS.ACCOUNT_VERIFICATION_OPTIONS,
        },
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 20 }}>
      {/* Alerts */}
      {alert && (
        <View
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 15,
            backgroundColor:
              alert.type === "success"
                ? "#e6f9ec"
                : alert.type === "error"
                ? "#fdecea"
                : "#fff8e5",
            borderLeftWidth: 5,
            borderLeftColor:
              alert.type === "success"
                ? "#28a745"
                : alert.type === "error"
                ? "#dc3545"
                : "#ffc107",
          }}
        >
          <Text style={{ fontWeight: "bold", color: "#000" }}>{alert.title}</Text>
          <Text style={{ color: "#555" }}>{alert.description}</Text>
        </View>
      )}

      {/* Verified Message */}
      {verified && (
        <View
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 15,
            backgroundColor: "#e6f9ec",
            borderColor: "#28a745",
            borderWidth: 1,
          }}
        >
          <Text style={{ color: "#28a745", fontWeight: "600" }}>
            ✅ Phone number verified successfully. You can now proceed with your KYC.
          </Text>
        </View>
      )}

      {/* Phone Input */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontWeight: "600", marginBottom: 5 }}>Phone Number</Text>
        <TextInput
          value={phone}
          editable={!verified}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
      </View>

      {/* OTP Input */}
      {!verified && (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontWeight: "600", marginBottom: 5 }}>Enter OTP</Text>
          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter OTP"
            keyboardType="numeric"
            maxLength={6}
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          />
        </View>
      )}

      {/* Buttons */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {verified ? (
          <>
            <Text style={{ color: "#28a745", fontWeight: "600" }}>✅ Verified</Text>
            <TouchableOpacity
              onPress={handleNext}
              style={{
                flex: 1,
                marginLeft: 10,
                backgroundColor: "#007bff",
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Continue to Verify BVN</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: "#007bff",
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {otp ? "Verify OTP" : "Request OTP"}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
