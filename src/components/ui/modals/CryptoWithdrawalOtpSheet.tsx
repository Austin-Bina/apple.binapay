import React, { useEffect, useState, useRef, forwardRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { routes } from "@constants/routes";
import API from "@lib/api";
import TransactionSuccessModal from "@components/ui/modals/TransactionSuccessModal";
import { useNavigation } from "@react-navigation/native";
import * as Crypto from "expo-crypto";
import { authenticateWithBiometrics } from "@helpers/biometricshelper";
import BottomSheetModal from "./BottomSheet/BottomSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { showToast } from "@helpers/toast";


type Props = {
  withdrawalData: {
    crypto_type: string;
    crypto_asset_id: string;
    crypto_network_id: string;
    wallet_address: string;
    amount: string;
    
  };
   amountToReceive: number;
   asset: string;
  onClose: () => void;
  onSuccessRedirect: () => void;
};

const CryptoWithdrawalOtpSheet = forwardRef<
  BottomSheetModalMethods,
  Props
>(({ withdrawalData, asset, amountToReceive, onClose, onSuccessRedirect }, ref) => {
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigation = useNavigation();
  const [redirectCountdown, setRedirectCountdown] = useState(5);
const [isProcessing, setIsProcessing] = useState(false);

 
  const idempotencyKeyRef = useRef<string | null>(null);
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current = Crypto.randomUUID();
  }

  const biometricToken = Crypto.randomUUID();
  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;


  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(
        () => setCooldown((c) => Math.max(0, c - 1)),
        1000
      );
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (showSuccess && redirectCountdown > 0) {
      const timer = setInterval(
        () => setRedirectCountdown((c) => c - 1),
        1000
      );
      return () => clearInterval(timer);
    } else if (redirectCountdown === 0) {
      onSuccessRedirect();
    }
  }, [showSuccess, redirectCountdown]);

  /* ---------------- ACTIONS ---------------- */

  const sendOtp = async () => {
    if (cooldown > 0) return;
    setIsProcessing(true);
    try {
      API.defaults.baseURL = BASE_URL;
      const res = await API.post(routes.api.v1.auth.cryptowithdrawalotp, {
        asset_id: withdrawalData.crypto_asset_id,
        network_id: withdrawalData.crypto_network_id,
        amount: withdrawalData.amount,
      });

      setSent(true);
      setCooldown(30);
      showToast({ variant: "success", message: "OTP sent to your email/phone." });
    } catch (e: any) {
      showToast({
        variant: "error",
        message: e.response?.data?.message || "Failed to send OTP. Try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const submit = async () => {
    if (!otp) return;
    setIsProcessing(true);
    try {
      API.defaults.baseURL = BASE_URL;

      const res = await API.post(
        routes.api.v1.services.wallets.withdrawcrypto,
        {
          ...withdrawalData,
          otp,
        },
        {
          headers: {
            "Idempotency-Key": idempotencyKeyRef.current,
          },
        }
      );

      if (res.data.success) {
               setSuccessMessage(    ` 
          You will receive ${amountToReceive}${asset} to the destination address shortly.`  );
        setShowSuccess(true);
      }
    } catch (e: any) {
      const status = e.response?.status;
      const message = e.response?.data?.message;

      if (status === 403) {
        showToast({
          variant: "warning",
          message: "Your account is temporarily blocked. Please contact support.",
        });
        setOtp("");
        return;
      }

      showToast({
        variant: "error",
        message: message || "Invalid OTP",
      });
      setOtp("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBiometricConfirm = async () => {
    try {
      setIsProcessing(true);
      await authenticateWithBiometrics();
      API.defaults.baseURL = BASE_URL;

      const res = await API.post(
        routes.api.v1.services.wallets.withdrawcrypto,
        {
          ...withdrawalData,
          biometric: true,
          biometric_token: biometricToken,
        },
        {
          headers: {
            "Idempotency-Key": idempotencyKeyRef.current,
          },
        }
      );

      if (res.data.success) {

        setSuccessMessage(    ` 
          You will receive ${amountToReceive}${asset} to the destination address shortly.`  );
        setShowSuccess(true);
      }
    } catch (err: any) {
      showToast({
        variant: "error",
        message: err?.message || "Biometric authentication failed",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <BottomSheetModal
      ref={ref}
      headerTitle="Enter OTP"
      initialSnapPoints={["65%"]}
      index={0}
      onDismiss={onClose}
      enableDynamicSizing={false}
    >
      <View style={styles.container}>
        {!showSuccess ? (
          <>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              OTP will be sent to your email. Enter it to confirm withdrawal.
            </Text>


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
                disabled={isProcessing || cooldown > 0}
                style={[
                  styles.sendButton,
                  (isProcessing || cooldown > 0) && styles.disabled,
                ]}
              >
               
                  <Text style={styles.sendText}>
                    {cooldown > 0
                      ? `Resend (${cooldown})`
                      : sent
                      ? "Resend OTP"
                      : "Send OTP"}
                  </Text>
                
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={submit}
              disabled={!otp || isProcessing}
              style={[styles.submitButton, (!otp || isProcessing) && styles.disabled]}
            >
             
                <Text style={styles.submitText}>Submit Withdrawal</Text>
              
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.biometricContainer}
              onPress={handleBiometricConfirm}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="fingerprint"
                size={48}
                color="#2563eb"
              />
              <Text style={styles.biometricLabel}>Use Biometric</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TransactionSuccessModal
            visible={showSuccess}
            onClose={() => setShowSuccess(false)}
            onViewHistory={() => {
              setShowSuccess(false);
              navigation.navigate("TransactionHistory" as never);
            }}
            title="Withdrawal Successful"
            message={successMessage}
          />
        )}
      </View>
      <PleaseWaitModal visible={isProcessing} />
      
    </BottomSheetModal>
  );
});

export default CryptoWithdrawalOtpSheet;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 12, color: "#555" },
  alert: { padding: 10, borderRadius: 8, marginBottom: 10, textAlign: "center" },
  success: { backgroundColor: "#d1fae5", color: "#065f46" },
  error: { backgroundColor: "#fee2e2", color: "#991b1b" },
  warning: { backgroundColor: "#fef3c7", color: "#92400e" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
  sendButton: { marginLeft: 8, backgroundColor: "#2563eb", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  sendText: { color: "#fff", fontWeight: "600" },
  submitButton: { backgroundColor: "#2563eb", padding: 14, borderRadius: 10, marginBottom: 10 },
  submitText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  disabled: { opacity: 0.5 },
  biometricContainer: { marginTop: 16, alignItems: "center" },
  biometricLabel: { fontSize: 10, color: "#000000", fontWeight: "500" },
});
