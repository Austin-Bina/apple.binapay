import * as LocalAuthentication from "expo-local-authentication";

export async function authenticateWithBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    throw new Error("Biometric authentication not available");
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Confirm withdrawal with fingerprint",
    fallbackLabel: "Use OTP",
    cancelLabel: "Cancel",
      disableDeviceFallback: false, // allow PIN fallback

  });



  if (!result.success) {
    throw new Error("Biometric authentication failed");
  }

  return true;
}
