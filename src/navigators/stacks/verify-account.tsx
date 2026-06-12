// navigators/stacks/verify-account.tsx  (or whatever your file is named)

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { KYCParamList } from "@navigators/types";
import { SCREENS } from "@constants/screens";

// ── Existing screens (keep their original paths) ──────────────────────────
import KYCOptionsScreen          from "@screens/kyc/KYCOptionsScreen";
import BVNVerificationScreen     from "@screens/kyc/BVNVerificationScreen";
import NinVerificationScreen     from "@screens/kyc/NINVerificationScreen";

// ── New KYC screens ───────────────────────────────────────────────────────
import VerificationHubScreen     from "@screens/kyc/VerificationHub";
import PhoneVerificationScreen   from "@screens/kyc/PhoneVerificationScreen";
import OtpEntryScreen            from "@screens/kyc/OtpEntryScreen";
import BvnNinChoiceScreen        from "@screens/kyc/BvnNinChoiceScreen";
import VerificationSuccessScreen from "@screens/kyc/VerificationSuccessScreen";
import UpgradeTier2Screen        from "@screens/kyc/UpgradeTier2Screen";
import FaceVerificationScreen    from "@screens/kyc/FaceVerification";
import AddressVerificationScreen from "@screens/kyc/AddressVerification";
import VerificationLimitsScreen  from "@screens/kyc/VerificationLimitsScreen";

const Stack = createNativeStackNavigator<KYCParamList>();

export default function KYCStack() {
  console.log("KYC screen names:", {
    hub: SCREENS.VERIFICATION_HUB,
    options: SCREENS.ACCOUNT_VERIFICATION_OPTIONS,
    phone: SCREENS.PHONE_VERIFICATION,
    otp: SCREENS.VERIFICATION_OTP,
    bvnNinChoice: SCREENS.BVN_NIN_CHOICE,
    bvn: SCREENS.BVN_VERIFICATION,
    nin: SCREENS.NIN_VERIFICATION,
    success: SCREENS.VERIFICATION_SUCCESS,
    upgrade: SCREENS.UPGRADE_TIER2,
    face: SCREENS.FACE_VERIFICATION,
    address: SCREENS.ADDRESS_VERIFICATION,
    limits: SCREENS.VERIFICATION_LIMITS,
  });  return (
    <Stack.Navigator
      initialRouteName={SCREENS.VERIFICATION_HUB}
      screenOptions={{ headerShown: false }}
    >
      {/* Hub — entry point */}
      <Stack.Screen
        name={SCREENS.VERIFICATION_HUB}
        component={VerificationHubScreen}
      />

      {/* Legacy options screen — keep for backwards compat */}
      <Stack.Screen
        name={SCREENS.ACCOUNT_VERIFICATION_OPTIONS}
        component={KYCOptionsScreen}
      />

      {/* Phone verification flow */}
      <Stack.Screen
        name={SCREENS.PHONE_VERIFICATION}
        component={PhoneVerificationScreen}
      />
      <Stack.Screen
        name={SCREENS.VERIFICATION_OTP}
        component={OtpEntryScreen}
      />

      {/* BVN / NIN choice + existing screens */}
      <Stack.Screen
        name={SCREENS.BVN_NIN_CHOICE}
        component={BvnNinChoiceScreen}
      />
      <Stack.Screen
        name={SCREENS.BVN_VERIFICATION}
        component={BVNVerificationScreen}
      />
      <Stack.Screen
        name={SCREENS.NIN_VERIFICATION}
        component={NinVerificationScreen}
      />

      {/* Success screens */}
      <Stack.Screen
        name={SCREENS.VERIFICATION_SUCCESS}
        component={VerificationSuccessScreen}
      />

      {/* Tier 2 flow */}
      <Stack.Screen
        name={SCREENS.UPGRADE_TIER2}
        component={UpgradeTier2Screen}
      />
      <Stack.Screen
        name={SCREENS.FACE_VERIFICATION}
        component={FaceVerificationScreen}
      />
      <Stack.Screen
        name={SCREENS.ADDRESS_VERIFICATION}
        component={AddressVerificationScreen}
      />

 
      {/* Limits overview */}
      <Stack.Screen
        name={SCREENS.VERIFICATION_LIMITS}
        component={VerificationLimitsScreen}
      />
    </Stack.Navigator>
  );
}
