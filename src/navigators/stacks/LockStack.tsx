// navigators/stacks/LockStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AppLockScreen from "@screens/AppLockScreen";
import ChangeTransactionPin from "@screens/account/ChangeTransactionPin";
import SupportStack from "./support";

export type LockStackParamList = {
  Lock: undefined;
  Help: undefined;
  ForgotPin: undefined;
};

const LockNav = createNativeStackNavigator<LockStackParamList>();

type Props = { onUnlock: () => void };

export default function LockStack({ onUnlock }: Props) {
  return (
    <LockNav.Navigator initialRouteName="Lock" screenOptions={{ headerShown: false }}>
      <LockNav.Screen name="Lock">
        {() => <AppLockScreen onUnlock={onUnlock} />}
      </LockNav.Screen>

      <LockNav.Screen name="Help" component={SupportStack} />
      <LockNav.Screen name="ForgotPin" component={ChangeTransactionPin} />
    </LockNav.Navigator>
  );
}
