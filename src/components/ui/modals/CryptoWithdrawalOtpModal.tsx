import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { routes } from "@constants/routes";
import API from "@lib/api";
import { useNavigation } from "@react-navigation/native";
import TransactionSuccessModal from "@components/ui/modals/TransactionSuccessModal";


type Props = {
  withdrawalData: {
    crypto_type: string;
    crypto_asset_id: string;
    crypto_network_id: string;
    wallet_address: string;
    amount: string;
  };
  visible: boolean;
  onClose: () => void;
  onSuccessRedirect: () => void; // replace router.get('/dashboard')
};

export default function EnterOtpModal({
  withdrawalData,
  visible,
  onClose,
  onSuccessRedirect,
}: Props) {
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const navigation = useNavigation();
  const [showSuccess, setShowSuccess] = useState(false);
const [successMessage, setSuccessMessage] = useState("");
  
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // auto-clear alert
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((c) => Math.max(0, c - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);
  
/*
  // redirect countdown
  useEffect(() => {
    if (showSuccess && redirectCountdown > 0) {
      const timer = setInterval(() => {
        setRedirectCountdown((c) => c - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (redirectCountdown === 0) {
      onSuccessRedirect();
    }
  }, [showSuccess, redirectCountdown]);
*/
  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  const sendOtp = async () => {
    if (cooldown > 0) return;
    setSending(true);
    try {
      API.defaults.baseURL = BASE_URL;

      const res = await API.post(routes.api.v1.auth.cryptowithdrawalotp, {
        asset_id: withdrawalData.crypto_asset_id,
        network_id: withdrawalData.crypto_network_id,
        amount: withdrawalData.amount,
      });

      setSent(true);
      setCooldown(30);
      setAlert({ type: "success", message: "OTP sent to your email/phone." });
    } catch (e: any) {
      setAlert({
        type: "error",
        message: e.response?.data?.message || "Failed to send OTP. Try again.",
      });
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
  if (!otp) return;  // prevent empty submission
  setSending(true);  // disable button immediately
  try {
    API.defaults.baseURL = BASE_URL;

    const res = await API.post(routes.api.v1.services.wallets.withdrawcrypto, {
      ...withdrawalData,
      otp,
    });

    if (res.data.success) {
      const receivedAmount = parseFloat(withdrawalData.amount).toLocaleString();
      setSuccessMessage(`You received ${receivedAmount}.`);
      setShowSuccess(true);
    }
    
  } catch (e: any) {
    const status = e.response?.status;
    const message = e.response?.data?.message;

    // 🔥 1. CHECK FOR BLOCKED USER (403)
    if (status === 403) {
      setAlert({
        type: "error",
        message: "Your account is temporarily blocked. Please contact support.",
      });
      setOtp("");
      return;  // ⛔ STOP further processing
    }

    // 🔥 2. HANDLE ALL OTHER ERRORS (normal errors)
    setAlert({
      type: "error",
      message: message || "Invalid OTP",
    });
    setOtp("");

  } finally {
    setSending(false);
  }
};


  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {!showSuccess ? (
            <>
              <Text style={styles.title}>Enter OTP</Text>
              <Text style={styles.subtitle}>
                OTP will be sent to your email. Enter it to confirm withdrawal.
              </Text>

              {alert && (
                <Text
                  style={[
                    styles.alert,
                    alert.type === "success"
                      ? styles.success
                      : alert.type === "error"
                      ? styles.error
                      : styles.warning,
                  ]}
                >
                  {alert.message}
                </Text>
              )}

              {/* OTP Input + Send */}
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  onPress={sendOtp}
                  disabled={sending || cooldown > 0}
                  style={[
                    styles.sendButton,
                    (sending || cooldown > 0) && styles.disabled,
                  ]}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.sendText}>
                      {cooldown > 0
                        ? `Resend (${cooldown})`
                        : sent
                        ? "Resend OTP"
                        : "Send OTP"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Submit */}
              <TouchableOpacity
      onPress={submit}
      disabled={!otp || sending}   // ✅ disable if OTP empty or request in progress
      style={[
    styles.submitButton,
      (!otp || sending) && styles.disabled,  // add disabled style
     ]}
    >
  {sending ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.submitText}>Submit Withdrawal</Text>
  )}
</TouchableOpacity>


              {/* Cancel */}
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : ( <TransactionSuccessModal
      visible={showSuccess}
      onClose={() => setShowSuccess(false)}
      onViewHistory={() => {
        setShowSuccess(false);
    navigation.navigate("TransactionHistory" as never);
      }}
      title="Withdrawal Successfully Submitted"
       message={successMessage}
    />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "90%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#111",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
    color: "#555",
  },
  alert: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: "center",
  },
  success: { backgroundColor: "#d1fae5", color: "#065f46" },
  error: { backgroundColor: "#fee2e2", color: "#991b1b" },
  warning: { backgroundColor: "#fef3c7", color: "#92400e" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  submitText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
  },
  cancelText: {
    textAlign: "center",
    color: "#555",
    fontWeight: "500",
  },
  disabled: {
    opacity: 0.5,
  },
});
