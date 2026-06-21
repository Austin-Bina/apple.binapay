import React, { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ServicesStackScreenProps } from "@navigators/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import API from "@lib/api";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import {
  getPendingTransaction, removePendingTransaction,
  setTransactionError, updatePendingTransaction,
} from "@store/slice/transactionSlice";
import { AxiosError } from "axios";
import { TransactionResponse } from "@type/transaction";
import { defaultTransactionResponse } from "@helpers/transaction";
import { settingsSliceActions } from "@store/slice/settings";
import { P, match } from "ts-pattern";
import { SCREENS } from "@constants/screens";
import { getNavigate } from "@utils/navigation";
import { TransactionForm } from "@enum/transaction";
import { route } from "@helpers/route";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Vibration, Image } from "react-native";
import { serviceProvidersMap } from "@constants/providers";

const BLUE       = "#2563EB";
const BRAND      = "#1E3A8A";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F8F9FB";
const SURFACE    = "#FFFFFF";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const SEPARATOR  = "#E5E7EB";
const ERROR      = "#DC2626";

const MAX_LENGTH = 4;

const sources = {
  [TransactionForm.Airtime]:     route("services.airtime"),
  [TransactionForm.Data]:        route("services.data"),
  [TransactionForm.Electricity]: route("services.electricity"),
  [TransactionForm.CableTv]:     route("services.cable"),
  [TransactionForm.Education]:   route("services.education.purchase"),
  [TransactionForm.Epins]:       route("services.epins"),
} as const;

type Props = ServicesStackScreenProps<"Confirm Transaction">;

export default function TransactionConfirmationScreen({ navigation, route }: Props) {
  const insets  = useSafeAreaInsets();
  const dispatch = useTypedDispatch();

  const [pin,      setPin]      = useState("");
  const [error,    setError]    = useState("");
  const [fetching, setFetching] = useState(false);
  const [shake,    setShake]    = useState(false);
  const [failCount, setFailCount] = useState(0);   
  const [cooldown,  setCooldown]  = useState(0);   
  const [success, setSuccess] = useState(false);
   const [successResult, setSuccessResult] = useState<TransactionResponse | null>(null);

  const { transactionId } = route.params;

  const pendingTransaction = useTypedSelector((state) =>
    getPendingTransaction(state.transaction, transactionId),
  );

  // ── Numpad press ──────────────────────────────────────────────────────────
  const handlePress = (digit: string) => {
    if (pin.length >= MAX_LENGTH) return;
      if (cooldown > 0) return; 
    setError("");
    setPin(prev => prev + digit);
  };

  const handleDelete = () => {
    setError("");
    setPin(prev => prev.slice(0, -1));
  };

  // ── Auto-submit when 4 digits entered ────────────────────────────────────
  useEffect(() => {
    if (pin.length === MAX_LENGTH) {
      processTransaction();
    }
  }, [pin]);

  
  useEffect(() => {
  if (cooldown <= 0) return;
  const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
  return () => clearInterval(t);
}, [cooldown]);


  const triggerError = (message: string) => {
    const newFailCount = failCount + 1;
     setFailCount(newFailCount); 
    setError(message);
    setShake(true);
    Vibration.vibrate(200);

    if (newFailCount >= 2) {
    setCooldown(60);
  }

    setTimeout(() => {
      setShake(false);
      setPin("");
    }, 500);
  };

  const processTransaction = async () => {
    try {
      setFetching(true);

      const response = await API.post(sources[transactionId], {
        ...pendingTransaction.data,
        pin,
      });

      const result = response.data as TransactionResponse;

      dispatch(updatePendingTransaction({
        ...pendingTransaction,
        data: {
          ...pendingTransaction.data,
          response: { ...defaultTransactionResponse, ...result },
        },
      }));

      setPin("");
      setSuccess(true);
     setSuccessResult(result);
     

    }  catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const result = response.data;

        if (result?.errors?.pin) {
          // PIN error — stay on screen, let user retry
          triggerError(result.errors.pin[0]);
          return; // ← this return prevents goBack() below
        }
        
        // All other errors — dispatch and go back
        if (result?.error_code === "client_insufficient_funds") {
          dispatch(settingsSliceActions.setApplicationError({
            code: "client_insufficient_funds", context: result,
          }));
        } else if (result?.transaction_info) {
          const invalidProviderError = match(result)
            .with({ transaction_info: { transaction: { response: { error: P.array(P.string.startsWith("Please check entered number is not")) } } } }, () => true)
            .otherwise(() => false);
          const minAmountError = match(result)
            .with({ transaction_info: { transaction: { response: { error: P.array(P.string.includes("minimum")) } } } }, () => true)
            .otherwise(() => false);
          const insufficientBalanceError = match(result)
            .with({ transaction_info: { transaction: { response: { error: P.array(P.string.includes("insufficient balance")) } } } }, () => true)
            .otherwise(() => false);
          const invalidVendorError = match(result)
            .with({ error_code: P.string.includes("invalid_vendor") }, () => true)
            .otherwise(() => false);

          if (insufficientBalanceError) {
            dispatch(setTransactionError({ ...defaultTransactionResponse, title: "Opps! We have had too many demands", description: "Sorry we are currently unable to process this request at the moment. Please try again after a few minutes. Your funds has been credited back to your wallet." }));
          } else if (minAmountError) {
            dispatch(setTransactionError({ ...defaultTransactionResponse, title: "Your amount is too small", description: "Sorry we do not currently process small transactions like this. Please try again with a larger amount." }));
          } else if (invalidProviderError) {
            dispatch(setTransactionError({ ...defaultTransactionResponse, description: "This number seems to be a ported number. Please try the transaction again after selecting 'Is this a ported number?' option." }));
          } else if (invalidVendorError) {
            dispatch(removePendingTransaction());
            dispatch(setTransactionError({ ...defaultTransactionResponse, ...result, _refetchPrices: true } as TransactionResponse));
          } else {
            dispatch(removePendingTransaction());
            dispatch(setTransactionError({ ...defaultTransactionResponse, ...result }));
          }
        } else {
          dispatch(removePendingTransaction());
          dispatch(setTransactionError(defaultTransactionResponse));
        }
      }

      // Only reaches here for non-PIN errors
      setPin("");
      navigation.goBack();
    } finally {
      setFetching(false);
    
    }
  };

  // ── Numpad layout ─────────────────────────────────────────────────────────
  const numpad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "del"],
  ];

const txnData = pendingTransaction?.data as any;

  if (success) {
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Confetti dots — decorative */}
      <View style={s.successWrap}>
        <View style={s.successIconWrap}>
          <MaterialCommunityIcons name="check" size={44} color="#fff" />
        </View>

        <Text style={s.successTitle}>Transaction Successful! 🎉</Text>
        <Text style={s.successSub}>Your purchase has been delivered successfully.</Text>

        {/* Receipt card */}
       {/* Receipt card */}
<View style={s.successCard}>
  {txnData?.phone && (
    <View style={s.receiptRow}>
      <Text style={s.receiptLabel}>Recipient</Text>
      <Text style={s.receiptValue}>{txnData.phone}</Text>
    </View>
  )}
  {txnData?.data_amount && (
    <View style={s.receiptRow}>
      <Text style={s.receiptLabel}>Data Bundle</Text>
      <Text style={s.receiptValue}>{txnData.data_amount}</Text>
    </View>
  )}
  {txnData?.provider && (
  <View style={s.receiptRow}>
    <Text style={s.receiptLabel}>Network</Text>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {serviceProvidersMap.internet[txnData.provider]?.logo && (
        <Image
          source={serviceProvidersMap.internet[txnData.provider].logo}
          style={{ width: 20, height: 20, borderRadius: 10 }}
          resizeMode="contain"
        />
      )}
      <Text style={s.receiptValue}>{String(txnData.provider).toUpperCase()}</Text>
    </View>
  </View>
)}
  <View style={s.receiptRow}>
    <Text style={s.receiptLabel}>Amount</Text>
    <Text style={s.receiptValue}>
      ₦{parseFloat(txnData?.amount || "0").toLocaleString("en-NG", { minimumFractionDigits: 2 })}
    </Text>
  </View>
</View>

        {/* Actions */}
        <TouchableOpacity
  style={s.doneBtn}
  onPress={async () => {
    const { navigate } = await getNavigate();
    navigate(SCREENS.MAIN, {
      screen: SCREENS.HOME,
      params: { screen: SCREENS.DASHBOARD },
    });
  }}
>
  <Text style={s.doneBtnText}>Done</Text>
</TouchableOpacity>

        <TouchableOpacity
          style={s.viewTxnBtn}
          onPress={async () => {
            const { navigate } = await getNavigate();
            navigate(SCREENS.MAIN, {
              screen: SCREENS.HOME,
              params: {
                screen: SCREENS.VIEW_TRANSACTION,
                params: { transactionId },
              },
            });
          }}
        >
          <Text style={s.viewTxnText}>View Receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Back button */}
      <TouchableOpacity
        style={[s.backBtn, { marginTop: 8, marginLeft: 16 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
      </TouchableOpacity>

      <View style={s.body}>
        {/* Lock icon */}
        <View style={s.lockWrap}>
          <MaterialCommunityIcons name="shield-lock-outline" size={48} color={BLUE} />
        </View>

        <Text style={s.title}>Enter PIN</Text>
        <Text style={s.subtitle}>Enter your 4-digit transaction PIN{"\n"}to complete this purchase</Text>

        {/* PIN dots */}
        <View style={[s.dotsRow, shake && s.dotsShake]}>
          {Array.from({ length: MAX_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i < pin.length && s.dotFilled,
                error && s.dotError,
              ]}
            />
          ))}
        </View>

        {/* Error message */}
        {!!error && (
          <Text style={s.errorText}>{error}</Text>
        )}

        {cooldown > 0 && (
  <Text style={s.cooldownText}>
    Too many failed attempts. Please wait {cooldown}s before retrying.
  </Text>
)}

        {/* Forgot PIN */}
        <TouchableOpacity style={s.forgotBtn} activeOpacity={0.7}>
          <Text style={s.forgotText}>Forgot PIN?</Text>
        </TouchableOpacity>
      </View>

      {/* Numpad */}
      <View style={[s.numpad, { paddingBottom: insets.bottom + 16 }]}>
        {numpad.map((row, ri) => (
          <View key={ri} style={s.numpadRow}>
            {row.map((key, ki) => {
              if (key === "") return <View key={ki} style={s.numpadKey} />;
              if (key === "del") return (
                <TouchableOpacity
                  key={ki}
                  style={s.numpadKey}
                  onPress={handleDelete}
                  activeOpacity={0.6}
                   disabled={fetching || cooldown > 0} 
                >
                  <MaterialCommunityIcons name="backspace-outline" size={24} color={LABEL} />
                </TouchableOpacity>
              );
              return (
                <TouchableOpacity
                  key={ki}
                  style={s.numpadKey}
                  onPress={() => handlePress(key)}
                  activeOpacity={0.6}
                  disabled={fetching || cooldown > 0}
                >
                  <Text style={s.numpadDigit}>{key}</Text>
                  {/* Letter hints below digits */}
                  <Text style={s.numpadHint}>
                    {["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ", "", ""][parseInt(key)] ?? ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Cancel */}
        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.cancelText}>Cancel Transaction</Text>
        </TouchableOpacity>
      </View>

      <PleaseWaitModal visible={fetching} />
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },

  body:        { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  lockWrap:    { width: 80, height: 80, borderRadius: 40, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  title:       { fontSize: 24, fontWeight: "800", color: LABEL, marginBottom: 8, letterSpacing: -0.4 },
  subtitle:    { fontSize: 14, color: SUBLABEL, textAlign: "center", lineHeight: 20, marginBottom: 32 },

  // PIN dots
  dotsRow:     { flexDirection: "row", gap: 16, marginBottom: 12 },
  dotsShake:   { transform: [{ translateX: 6 }] },
  dot:         { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: SEPARATOR, backgroundColor: "transparent" },
  dotFilled:   { backgroundColor: BLUE, borderColor: BLUE },
  dotError:    { borderColor: ERROR, backgroundColor: ERROR },

  errorText:   { fontSize: 13, color: ERROR, fontWeight: "500", marginBottom: 8 },
  forgotBtn:   { marginTop: 8 },
  forgotText:  { fontSize: 14, color: BLUE, fontWeight: "600" },

  // Numpad
  numpad:      { backgroundColor: SURFACE, borderTopWidth: 1, borderTopColor: SEPARATOR, paddingTop: 16 },
  numpadRow:   { flexDirection: "row", justifyContent: "space-around", marginBottom: 4 },
  numpadKey:   { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  numpadDigit: { fontSize: 24, fontWeight: "400", color: LABEL },
  numpadHint:  { fontSize: 9, color: SUBLABEL, letterSpacing: 1, marginTop: 1 },

  cancelBtn:   { alignItems: "center", paddingVertical: 12 },
  cancelText:  { fontSize: 14, fontWeight: "600", color: BLUE },
  cooldownText:    { fontSize: 12, color: SUBLABEL, textAlign: "center", marginTop: 4 },
   numpadKeyDisabled: { opacity: 0.35 },

  successWrap:    { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
successIconWrap:{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#16A34A", justifyContent: "center", alignItems: "center", marginBottom: 20, alignSelf: "center" },
successTitle:   { fontSize: 22, fontWeight: "800", color: LABEL, marginBottom: 8, textAlign: "center" },
successSub:     { fontSize: 14, color: SUBLABEL, textAlign: "center", marginBottom: 24 },
successCard:     { width: "100%", backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: SEPARATOR, marginBottom: 24 },
receiptRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: SEPARATOR },
receiptLabel: { fontSize: 13, color: SUBLABEL, flex: 1 },
receiptValue: { fontSize: 13, fontWeight: "700", color: LABEL, textAlign: "right", flexShrink: 1 },
doneBtn:         { width: "100%", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center", marginBottom: 12 },
doneBtnText:     { fontSize: 16, fontWeight: "700", color: "#fff" },
viewTxnBtn:      { width: "100%", paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: SEPARATOR },
viewTxnText:     { fontSize: 15, fontWeight: "600", color: LABEL },
});
