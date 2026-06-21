import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Modal, KeyboardAvoidingView, Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { selectNairaBalance } from "@store/selectors/auth";
import { formattedBalance } from "@utils/transactionutils";
import { showToast } from "@helpers/toast";
import { authenticateWithBiometrics } from "@helpers/biometricshelper";
import * as Crypto from "expo-crypto";
import {
  useGetBankListQuery,
  useResolveAccountMutation,
  useGetFeeSettingsQuery,
  useSendWithdrawalOtpMutation,
  useSubmitWithdrawalMutation,
  Bank,
} from "@store/redux-api/fundsApi";
import { saveRecentRecipient, getRecentRecipients, RecentRecipient } from "@helpers/recentRecipients";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

// Phone-number-based banks (account number = phone number minus leading 0)
const PHONE_NUMBER_BANKS = [
  { name: "OPay", code: "305" },
  { name: "PalmPay", code: "100033" },
  { name: "Moniepoint MFB", code: "090405" },
];

// Nigerian phone prefixes without leading 0 (as they appear in 10-digit account numbers)
const PHONE_PREFIXES_10 = [
  "803","806","810","813","814","816","703","704","706","707","903","906","913","916", // MTN
  "802","808","812","701","708","901","902","904","907","912","911",                   // Airtel
  "805","807","811","815","705","905","915","817",                                     // Glo
  "809","818","908","909",                                                             // 9mobile
];
const PINNED_BANK_CODES = ["305", "100033", "090405"];

function looksLikePhoneNumber(accountNumber: string): boolean {
  if (accountNumber.length !== 10) return false;
  const prefix = accountNumber.slice(0, 3);
  return PHONE_PREFIXES_10.includes(prefix);
}

type Step = "form" | "review";

export default function WithdrawNairaScreen({ navigation }: any) {
  const insets       = useSafeAreaInsets();
  const dispatch     = useTypedDispatch();
  const nairaBalance = useSelector(selectNairaBalance);
  const idempotencyKey = useRef(Crypto.randomUUID());

  const [step, setStep]                   = useState<Step>("form");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank]   = useState<Bank | null>(null);
  const [accountName, setAccountName]     = useState("");
  const [amount, setAmount]               = useState("");
  const [narration, setNarration]         = useState("");
  const [bankSearch, setBankSearch]       = useState("");
  const [showBankModal, setShowBankModal] = useState(false);
  const [isResolvingName, setIsResolvingName] = useState(false);

  const [showOtpSheet, setShowOtpSheet] = useState(false);
  const [otp, setOtp]                   = useState("");
  const [otpSent, setOtpSent]           = useState(false);
  const [otpCooldown, setOtpCooldown]   = useState(0);
  const [showSuccess, setShowSuccess]   = useState(false);

  const { data: bankListData, isLoading: loadingBanks } = useGetBankListQuery();
  const { data: feeSettings } = useGetFeeSettingsQuery();
  const [resolveAccount] = useResolveAccountMutation();
  const [sendOtp, { isLoading: sendingOtp }]          = useSendWithdrawalOtpMutation();
  const [submitWithdrawal, { isLoading: submitting }] = useSubmitWithdrawalMutation();

  const banks         = bankListData?.data ?? [];
  const filteredBanks = useMemo(() => {
  const searched = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );
  const pinned   = searched.filter(b => PINNED_BANK_CODES.includes(b.code));
  const rest     = searched.filter(b => !PINNED_BANK_CODES.includes(b.code));
  return [...pinned, ...rest];
}, [banks, bankSearch]);
  const feeType       = feeSettings?.fee_type      ?? "flat";
  const feeAmount     = feeSettings?.fee_amount    ?? 0;
  const minAmount     = feeSettings?.min_withdrawal ?? 0;
  const maxAmount     = feeSettings?.max_withdrawal ?? 0;
  const parsedAmount  = parseFloat(amount) || 0;
  const fee           = feeType === "percent" ? (parsedAmount * feeAmount) / 100 : feeAmount;
  const amountToReceive = parsedAmount - fee;

  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([]);
  const [showRecent, setShowRecent]             = useState(false);

  useEffect(() => {
  getRecentRecipients().then(setRecentRecipients);
}, []);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setInterval(() => setOtpCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [otpCooldown]);

  useEffect(() => {
  if (accountNumber.length === 10 && selectedBank) handleResolve();
  else setAccountName("");

  if (looksLikePhoneNumber(accountNumber) && !selectedBank) {
    setShowBankModal(true);
  }
}, [accountNumber, selectedBank]);

  const handleResolve = async () => {
    if (!selectedBank || accountNumber.length !== 10) return;
    setIsResolvingName(true);
    setAccountName("");
    try {
      const result = await resolveAccount({ account_number: accountNumber, bank_code: selectedBank.code }).unwrap();
      if (result.is_valid && result.account_name) setAccountName(result.account_name);
      else showToast({ variant: "error", message: "Account not found." });
    } catch { showToast({ variant: "error", message: "Could not verify account." }); }
    finally { setIsResolvingName(false); }
  };

  const formError = (): string | null => {
    if (!accountNumber || accountNumber.length !== 10) return "Enter a valid 10-digit account number";
    if (!selectedBank)  return "Select a bank";
    if (!accountName)   return "Account name not verified yet";
    if (!parsedAmount || parsedAmount <= 0) return "Enter an amount";
    if (parsedAmount < minAmount) return `Minimum is ₦${minAmount.toLocaleString()}`;
    if (maxAmount && parsedAmount > maxAmount) return `Maximum is ₦${maxAmount.toLocaleString()}`;
    if (parsedAmount + fee > parseFloat(nairaBalance)) return "Insufficient balance (including fee)";
    return null;
  };

  const handleContinue = () => {
    const err = formError();
    if (err) { showToast({ variant: "warning", message: err }); return; }
    setStep("review");
  };

  const handleSendOtp = async () => {
    try {
      await sendOtp().unwrap();
      setOtpSent(true); setOtpCooldown(30);
      showToast({ variant: "success", message: "OTP sent to your email." });
    } catch { showToast({ variant: "error", message: "Failed to send OTP." }); }
  };


  const matchedRecipient = useMemo(() =>
  accountNumber.length >= 4
    ? recentRecipients.find(r => r.account_number.startsWith(accountNumber))
    : null,
  [accountNumber, recentRecipients]
);

  const handleSubmit = async (authMethod: "otp" | "biometric") => {
    let payload: any = {
      amount: parsedAmount,
      account_number: accountNumber,
      bank_code: selectedBank!.code,
      account_name: accountName,
      bank_name: selectedBank!.name,
      narration: narration || undefined,
      idempotency_key: idempotencyKey.current,
    };
    if (authMethod === "otp") {
      if (!otp) { showToast({ variant: "warning", message: "Enter your OTP." }); return; }
      payload.otp = otp;
    } else {
      try {
        await authenticateWithBiometrics();
        payload.biometric = true;
        payload.biometric_token = Crypto.randomUUID();
      } catch { showToast({ variant: "error", message: "Biometric failed." }); return; }
    }
    try {
      const result = await submitWithdrawal(payload).unwrap();
      if (result.success) { setShowSuccess(true); await dispatch(authSliceActions.fetchUserProfile()); 
      await saveRecentRecipient({
    account_number: accountNumber,
    account_name:   accountName,
    bank_name:      selectedBank!.name,
    bank_code:      selectedBank!.code,
      });

      }

    } catch (e: any) {
  const status  = e?.status;
  const data    = e?.data;

  // Extract the most descriptive message available
  const message = data?.error ?? data?.message ?? data?.errors?.[0] ?? "Transfer failed. Please try again.";

  if (status === 403) {
    showToast({ variant: "warning", message: "Your account is blocked. Contact support." });
  } else if (status === 422) {
    // Covers: OTP invalid, verification required, KYC per-transaction limit
    showToast({ variant: "warning", message });
    if (message.toLowerCase().includes("otp")) setOtp("");
  } else if (status === 400) {
    // Covers: minimum withdrawal, maximum withdrawal, insufficient balance
    showToast({ variant: "warning", message });
  } else if (status === 429) {
    showToast({ variant: "warning", message: "Too many attempts. Please wait and try again." });
  } else {
    showToast({ variant: "error", message });
  }
}
  };

  const quickAmounts = [1000, 5000, 10000];

  // ── Success ───────────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.successWrap}>
          <View style={s.successIcon}>
            <MaterialCommunityIcons name="check" size={44} color="#fff" />
          </View>
          <Text style={s.successTitle}>Transfer Submitted</Text>
          <Text style={s.successSub}>Your money has been sent successfully</Text>
          <Text style={s.successAmount}>₦{parsedAmount.toLocaleString()}.00</Text>
          <View style={s.receiptCard}>
            <ReciptRow label="Recipient">
              <View style={s.recipientRow}>
                <View style={s.recipientAvatar}>
                  <Text style={s.recipientInitials}>{accountName.split(" ").map(w => w[0]).slice(0, 2).join("")}</Text>
                </View>
                <View>
                  <Text style={s.recipientName}>{accountName}</Text>
                  <Text style={s.recipientMeta}>{accountNumber} • {selectedBank?.name}</Text>
                </View>
              </View>
            </ReciptRow>
            {narration ? <ReciptRow label="Narration" value={narration} /> : null}
          </View>
          <TouchableOpacity style={s.doneBtn} onPress={() => navigation.navigate("Dashboard")}>
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Review ────────────────────────────────────────────────────────────────
  if (step === "review") {
    return (
      <View style={[s.root]}>

        <ScreenHeader
       title="Review Transfer"
       subtitle="Please confirm the details"
       onBack={() => setStep("form")}
       rightIcon="shield-check-outline"
        />

        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 }}>
          <Text style={s.sectionLabel}>Recipient</Text>
          <View style={s.reviewCard}>
            <View style={s.recipientRow}>
              <View style={s.recipientAvatar}>
                <Text style={s.recipientInitials}>{accountName.split(" ").map(w => w[0]).slice(0, 2).join("")}</Text>
              </View>
              <View>
                <Text style={s.recipientName}>{accountName}</Text>
                <Text style={s.recipientMeta}>{accountNumber}</Text>
                <Text style={s.recipientMeta}>{selectedBank?.name}</Text>
              </View>
            </View>
          </View>

          <Text style={s.sectionLabel}>Transfer Details</Text>
          <View style={s.reviewCard}>
           <ReviewRow label="Amount Sent"         value={`₦${parsedAmount.toLocaleString()}`} />
            <ReviewRow label="Transaction Fee"     value={fee === 0 ? "Free 🎉" : `₦${fee.toLocaleString()}`} />
            <View style={s.reviewRowDivider} />
            <ReviewRow label="Total Deducted"      value={`₦${(parsedAmount + fee).toLocaleString()}`} bold />
          </View>

          {narration ? (
            <>
              <Text style={s.sectionLabel}>Narration</Text>
              <View style={s.reviewCard}><Text style={s.narrationValue}>{narration}</Text></View>
            </>
          ) : null}

          <View style={s.secureNote}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color={BLUE} />
            <View style={{ flex: 1 }}>
              <Text style={s.secureTitle}>Your transfer is secure</Text>
              <Text style={s.secureSub}>BinaPay uses bank-grade security to protect your transactions.</Text>
            </View>
          </View>
        </ScrollView>

        {showOtpSheet ? (
          <View style={[s.otpSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={s.otpTitle}>Confirm Transfer</Text>
            <Text style={s.otpSub}>Enter the OTP sent to your email.</Text>
            <View style={s.otpRow}>
              <TextInput style={s.otpInput} placeholder="Enter OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
              <TouchableOpacity style={[s.sendOtpBtn, (sendingOtp || otpCooldown > 0) && s.disabledBtn]} onPress={handleSendOtp} disabled={sendingOtp || otpCooldown > 0}>
                <Text style={s.sendOtpText}>{otpCooldown > 0 ? `Resend (${otpCooldown}s)` : otpSent ? "Resend" : "Send OTP"}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[s.confirmBtn, (!otp || submitting) && s.disabledBtn]} onPress={() => handleSubmit("otp")} disabled={!otp || submitting} activeOpacity={1} >
              <Text style={s.confirmBtnText}>{submitting ? "Processing..." : "Confirm & Send"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.biometricRow} onPress={() => handleSubmit("biometric")}>
              <MaterialCommunityIcons name="fingerprint" size={36} color={BLUE} />
              <Text style={s.biometricLabel}>Use Biometric Instead</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelLink} onPress={() => setShowOtpSheet(false)}>
              <Text style={s.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity style={s.confirmBtn} onPress={() => setShowOtpSheet(true)}>
              <Text style={s.confirmBtnText}>Confirm & Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root]}>
      
      <ScreenHeader
  title="Send Money"
  subtitle="Transfer to bank account"
  onBack={() => navigation.goBack()}
  rightIcon="shield-check-outline"
    />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Security banner */}
          <View style={s.heroBanner}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color={BLUE} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.heroTitle}>Fast · Secure · Seamless</Text>
              <Text style={s.heroSub}>Send to any Nigerian bank account instantly.</Text>
            </View>
          </View>

          {/* Receiver card — compact, all fields in one card */}
          <Text style={s.sectionLabel}>Receiver Details</Text>

          {/* Recent recipients */}
{recentRecipients.length > 0 && (
  <View style={s.recentWrap}>
    <TouchableOpacity
      style={s.recentHeader}
      onPress={() => setShowRecent(v => !v)}
    >
      <MaterialCommunityIcons name="history" size={14} color={BLUE} />
      <Text style={s.recentHeaderText}>Recent Recipients</Text>
      <MaterialCommunityIcons
        name={showRecent ? "chevron-up" : "chevron-down"}
        size={14} color={BLUE}
      />
    </TouchableOpacity>

    {showRecent && (
      <View style={s.recentList}>
        {recentRecipients.map((r, i) => (
          <TouchableOpacity
            key={r.account_number}
            style={[s.recentItem, i < recentRecipients.length - 1 && s.recentItemBorder]}
            onPress={() => {
              setAccountNumber(r.account_number);
              setAccountName(r.account_name);
              setSelectedBank({ name: r.bank_name, code: r.bank_code });
              setShowRecent(false);
            }}
          >
            <View style={s.recentAvatar}>
              <Text style={s.recentInitials}>
                {r.account_name.split(" ").map(w => w[0]).slice(0, 2).join("")}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.recentName}>{r.account_name}</Text>
              <Text style={s.recentMeta}>{r.account_number} · {r.bank_name}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
)}
          <View style={s.formCard}>
            {/* Account Number */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Account Number</Text>
              <View style={s.fieldRow}>
                <TextInput
                  style={s.fieldInput}
                  placeholder="Enter 10-digit account number"
                  placeholderTextColor="#9ca3af"
                  value={accountNumber}
                  onChangeText={v => setAccountNumber(v.replace(/\D/g, "").slice(0, 10))}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>
             
             {/* ── Beneficiary suggestion ── */}
{matchedRecipient && accountNumber !== matchedRecipient.account_number && (
  <TouchableOpacity
    style={s.suggestionBanner}
    onPress={() => {
      setAccountNumber(matchedRecipient.account_number);
      setAccountName(matchedRecipient.account_name);
      setSelectedBank({ name: matchedRecipient.bank_name, code: matchedRecipient.bank_code });
    }}
    activeOpacity={0.85}
  >

    <View style={s.suggestionAvatar}>
      <Text style={s.suggestionInitials}>
        {matchedRecipient.account_name.split(" ").map(w => w[0]).slice(0, 2).join("")}
      </Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.suggestionName}>{matchedRecipient.account_name}</Text>
      <Text style={s.suggestionMeta}>{matchedRecipient.account_number} · {matchedRecipient.bank_name}</Text>
    </View>
    <Text style={s.suggestionUse}>Use</Text>
  </TouchableOpacity>
)}


            <View style={s.fieldDivider} />

            {/* Bank */}
            <TouchableOpacity style={s.fieldWrap} onPress={() => setShowBankModal(true)}>
              <Text style={s.fieldLabel}>Bank</Text>
              <View style={s.fieldRow}>
                <Text style={[s.fieldInput, !selectedBank && { color: "#9ca3af" }]}>
                  {selectedBank ? selectedBank.name : "Select bank"}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <View style={s.fieldDivider} />

            {/* Account Name */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Account Name</Text>
              {isResolvingName
                ? <Text style={s.resolving}>Verifying...</Text>
                : <Text style={[s.fieldInput, !accountName && { color: "#9ca3af" }]}>{accountName || "—"}</Text>
              }
            </View>
          </View>

            {/* Balance display — above amount card */}
{/* Balance inline — compact */}
<View style={s.balanceInline}>
  <MaterialCommunityIcons name="wallet-outline" size={13} color={BLUE} />
  <Text style={s.balanceInlineText}>Balance: ₦{parseFloat(nairaBalance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</Text>
</View>

          {/* Amount card */}
          <Text style={s.sectionLabel}>Amount</Text>
          <View style={s.formCard}>
            <View style={s.amountRow}>
              <TextInput
                style={s.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                value={amount}
                onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ""))}
                keyboardType="numeric"
              />
              <Text style={s.amountCurrency}>NGN</Text>
            </View>
            <View style={s.quickRow}>
              {quickAmounts.map(v => (
                <TouchableOpacity key={v} style={[s.quickChip, amount === String(v) && s.quickChipActive]} onPress={() => setAmount(String(v))}>
                  <Text style={[s.quickChipText, amount === String(v) && s.quickChipTextActive]}>₦{v >= 1000 ? `${v / 1000}k` : v}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.quickChip} onPress={() => setAmount(nairaBalance)}>
                <Text style={s.quickChipText}>Max</Text>
              </TouchableOpacity>
            </View>
          </View>

                  {parsedAmount > 0 && (
                <View style={s.feePreview}>
                 <MaterialCommunityIcons
                  name={fee === 0 ? "gift-outline" : "information-outline"}
                  size={14}
                  color={fee === 0 ? "#16a34a" : BRAND}
                    />
                   <Text style={[s.feePreviewText, fee === 0 && { color: "#16a34a" }]}>
                   {fee === 0 ? "🎉 Free transfer — no fees!" : `Transaction fee: ₦${fee.toLocaleString()}`}
                   </Text>
                    </View>
                     )}


          {/* Narration */}
          <Text style={s.sectionLabel}>Narration <Text style={{ color: "#9ca3af", fontWeight: "400" }}>(Optional)</Text></Text>
          <View style={s.formCard}>
            <View style={s.narrationWrap}>
              <TextInput
                style={s.narrationInput}
                placeholder="What is this for?"
                placeholderTextColor="#9ca3af"
                value={narration}
                onChangeText={v => setNarration(v.slice(0, 50))}
                maxLength={50}
              />
              <Text style={s.narrationCount}>{narration.length}/50</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={[s.confirmBtn, !!formError() && s.disabledBtn]} onPress={handleContinue} disabled={!!formError()}>
          <Text style={s.confirmBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Bank modal */}
      <Modal visible={showBankModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.bankModal, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Select Bank</Text>
            <View style={s.searchWrap}>
              <MaterialCommunityIcons name="magnify" size={16} color="#9ca3af" />
              <TextInput style={s.searchInput} placeholder="Search bank..." placeholderTextColor="#9ca3af" value={bankSearch} onChangeText={setBankSearch} />
            </View>
            {loadingBanks ? <Text style={s.loadingText}>Loading banks...</Text> : (
              <FlatList
                data={filteredBanks}
                keyExtractor={item => item.code}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {
  const isPinned = PINNED_BANK_CODES.includes(item.code);
  const prevWasPinned = index > 0 && PINNED_BANK_CODES.includes(filteredBanks[index - 1].code);
  const showDivider = !isPinned && prevWasPinned && !bankSearch;

  return (
    <>
      {showDivider && (
        <View style={{ paddingHorizontal: 4, paddingVertical: 6 }}>
         
        </View>
      )}
      <TouchableOpacity
        style={[s.bankItem, selectedBank?.code === item.code && s.bankItemActive,
          isPinned && !bankSearch && { backgroundColor: "#EEF3FF" }
        ]}
        onPress={() => { setSelectedBank(item); setBankSearch(""); setShowBankModal(false); }}
      >
        <Text style={[s.bankItemText, selectedBank?.code === item.code && s.bankItemTextActive]}>
          {item.name}
        </Text>
        {selectedBank?.code === item.code
          ? <MaterialCommunityIcons name="check" size={16} color={BLUE} />
          : isPinned && !bankSearch
            ? <MaterialCommunityIcons name="star" size={13} color={BLUE} />
            : null
        }
      </TouchableOpacity>
    </>
  );
}}
              />
            )}
            <TouchableOpacity style={s.modalClose} onPress={() => setShowBankModal(false)}>
              <Text style={s.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ReviewRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.reviewRow}>
      <Text style={s.reviewLabel}>{label}</Text>
      <Text style={[s.reviewValue, bold && { fontWeight: "700" }]}>{value}</Text>
    </View>
  );
}

function ReciptRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <View style={s.receiptRow}>
      <Text style={s.receiptLabel}>{label}</Text>
      {children ?? <Text style={s.receiptValue}>{value}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: "#f8f9fb" },

  header:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:           { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginRight: 10 },
  headerTitle:       { fontSize: 15, fontWeight: "700", color: BRAND },
  headerSub:         { fontSize: 10, color: "#6b7280", marginTop: 1 },

  // Compact security banner
  heroBanner:        { flexDirection: "row", alignItems: "center", backgroundColor: "#EEF3FF", borderRadius: 10, padding: 10, marginBottom: 12 },
  heroTitle:         { fontSize: 12, fontWeight: "700", color: BRAND },
  heroSub:           { fontSize: 11, color: "#6b7280", marginTop: 1 },

  sectionLabel:      { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  formCard:          { backgroundColor: "#fff", borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },

  fieldWrap:         { paddingHorizontal: 14, paddingVertical: 10 },
  fieldLabel:        { fontSize: 11, color: "#9ca3af", marginBottom: 3 },
  fieldRow:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fieldInput:        { flex: 1, fontSize: 14, color: "#111827" },
  fieldDivider:      { height: 1, backgroundColor: "#f3f4f6", marginHorizontal: 14 },
  resolving:         { fontSize: 13, color: "#9ca3af", fontStyle: "italic" },

  amountRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  amountInput:       { flex: 1, fontSize: 20, fontWeight: "700", color: "#111827" },
  amountCurrency:    { fontSize: 13, color: "#9ca3af", fontWeight: "600" },
  quickRow:          { flexDirection: "row", gap: 6, padding: 10, flexWrap: "wrap" },
  quickChip:         { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 18, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  quickChipActive:   { backgroundColor: BLUE, borderColor: BLUE },
  quickChipText:     { fontSize: 12, fontWeight: "600", color: "#374151" },
  quickChipTextActive:{ color: "#fff" },

  narrationWrap:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10 },
  narrationInput:    { flex: 1, fontSize: 13, color: "#111827" },
  narrationCount:    { fontSize: 11, color: "#9ca3af" },

  footer:            { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  confirmBtn:        { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  confirmBtnText:    { fontSize: 15, fontWeight: "700", color: "#fff" },
  disabledBtn:       { opacity: 0.5 },

  reviewCard:        { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#f0f0f0" },
  reviewRow:         { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7 },
  reviewRowDivider:  { height: 1, backgroundColor: "#f3f4f6", marginVertical: 4 },
  reviewLabel:       { fontSize: 13, color: "#6b7280" },
  reviewValue:       { fontSize: 13, fontWeight: "600", color: "#111827" },
  narrationValue:    { fontSize: 13, color: "#111827" },

  secureNote:        { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "#EEF3FF", borderRadius: 10, padding: 12, marginBottom: 16 },
  secureTitle:       { fontSize: 12, fontWeight: "700", color: BRAND },
  secureSub:         { fontSize: 11, color: "#6b7280", marginTop: 2 },

  otpSheet:          { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  otpTitle:          { fontSize: 16, fontWeight: "700", color: BRAND, textAlign: "center", marginBottom: 4 },
  otpSub:            { fontSize: 12, color: "#6b7280", textAlign: "center", marginBottom: 14 },
  otpRow:            { flexDirection: "row", gap: 8, marginBottom: 12 },
  otpInput:          { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, textAlign: "center", letterSpacing: 4 },
  sendOtpBtn:        { backgroundColor: BLUE, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, justifyContent: "center" },
  sendOtpText:       { color: "#fff", fontWeight: "600", fontSize: 12 },
  biometricRow:      { alignItems: "center", marginTop: 14, gap: 4 },
  biometricLabel:    { fontSize: 12, color: "#6b7280" },
  cancelLink:        { alignItems: "center", marginTop: 10 },
  cancelLinkText:    { fontSize: 13, color: "#9ca3af" },

  modalOverlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bankModal:         { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: "80%" },
  modalHandle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 14 },
  modalTitle:        { fontSize: 15, fontWeight: "700", color: BRAND, marginBottom: 12 },
  searchWrap:        { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  searchInput:       { flex: 1, fontSize: 13, color: "#111827" },
  loadingText:       { textAlign: "center", color: "#9ca3af", padding: 20 },
  bankItem:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  bankItemActive:    { backgroundColor: "#EEF3FF", marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 8 },
  bankItemText:      { fontSize: 13, color: "#374151" },
  bankItemTextActive:{ color: BLUE, fontWeight: "600" },
  modalClose:        { marginTop: 14, paddingVertical: 12, alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 10 },
  modalCloseText:    { fontSize: 14, fontWeight: "600", color: "#374151" },

  successWrap:       { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  successIcon:       { width: 72, height: 72, borderRadius: 36, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  successTitle:      { fontSize: 20, fontWeight: "800", color: BRAND, marginBottom: 4 },
  successSub:        { fontSize: 13, color: "#6b7280", marginBottom: 12 },
  successAmount:     { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 20 },
  receiptCard:       { width: "100%", backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f0f0f0", marginBottom: 20 },
  receiptRow:        { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  receiptLabel:      { fontSize: 11, color: "#9ca3af", marginBottom: 3 },
  receiptValue:      { fontSize: 13, fontWeight: "600", color: "#111827" },
  recipientRow:      { flexDirection: "row", alignItems: "center", gap: 10 },
  recipientAvatar:   { width: 36, height: 36, borderRadius: 18, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  recipientInitials: { fontSize: 13, fontWeight: "700", color: BLUE },
  recipientName:     { fontSize: 13, fontWeight: "600", color: "#111827" },
  recipientMeta:     { fontSize: 11, color: "#6b7280" },
  doneBtn:           { width: "100%", backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  doneBtnText:       { fontSize: 15, fontWeight: "700", color: "#fff" },
  
  balanceInline:      { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8, marginTop: -4 },
balanceInlineText:  { fontSize: 12, color: BLUE, fontWeight: "600" },
feePreview:         { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EEF3FF", borderRadius: 8, padding: 8, marginBottom: 12, marginTop: -4 },
feePreviewText:     { fontSize: 12, color: BRAND, fontWeight: "500" },

recentWrap:       { marginBottom: 10 },
recentHeader:     { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6 },
recentHeaderText: { fontSize: 12, color: BLUE, fontWeight: "600", flex: 1 },
recentList:       { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden", marginTop: 4 },
recentItem:       { flexDirection: "row", alignItems: "center", gap: 10, padding: 10 },
recentItemBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
recentAvatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
recentInitials:   { fontSize: 12, fontWeight: "700", color: BLUE },
recentName:       { fontSize: 13, fontWeight: "600", color: "#111827" },
recentMeta:       { fontSize: 11, color: "#6b7280", marginTop: 1 },

suggestionBanner:   { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#EEF3FF", paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
suggestionAvatar:   { width: 30, height: 30, borderRadius: 15, backgroundColor: BLUE, justifyContent: "center", alignItems: "center" },
suggestionInitials: { fontSize: 11, fontWeight: "700", color: "#fff" },
suggestionName:     { fontSize: 12, fontWeight: "600", color: BRAND },
suggestionMeta:     { fontSize: 11, color: "#6b7280" },
suggestionUse:      { fontSize: 12, fontWeight: "700", color: BLUE },
phoneBankWrap:      { backgroundColor: "#EEF3FF", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
phoneBankLabel:     { fontSize: 11, color: "#6b7280", marginBottom: 8 },
phoneBankRow:       { flexDirection: "row", gap: 8, flexWrap: "wrap" },
phoneBankChip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1.5, borderColor: BLUE },
phoneBankChipText:  { fontSize: 12, fontWeight: "700", color: BLUE },
});
