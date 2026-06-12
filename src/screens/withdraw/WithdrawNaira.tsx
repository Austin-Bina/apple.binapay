import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Modal, KeyboardAvoidingView, Platform,
  StatusBar,
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

// ─── Brand tokens ────────────────────────────────────────────────────────────
const BRAND       = "#1E3A8A";
const BLUE        = "#2563EB";
const BLUE_LIGHT  = "#EEF3FF";   // iOS grouped bg tint
const BLUE_MID    = "#DBEAFE";   // subtle separator / chip bg
const SURFACE     = "#FFFFFF";
const BG          = "#F2F2F7";   // iOS systemGroupedBackground
const LABEL       = "#111827";
const SUBLABEL    = "#6B7280";
const PLACEHOLDER = "#9CA3AF";
const SEPARATOR   = "#E5E7EB";
const SUCCESS     = "#16A34A";

type Step = "form" | "review";

export default function WithdrawNairaScreen({ navigation }: any) {
  const insets         = useSafeAreaInsets();
  const dispatch       = useTypedDispatch();
  const nairaBalance   = useSelector(selectNairaBalance);
  const idempotencyKey = useRef(Crypto.randomUUID());

  // ─── All original state — untouched ──────────────────────────────────────
  const [step, setStep]                       = useState<Step>("form");
  const [accountNumber, setAccountNumber]     = useState("");
  const [selectedBank, setSelectedBank]       = useState<Bank | null>(null);
  const [accountName, setAccountName]         = useState("");
  const [amount, setAmount]                   = useState("");
  const [narration, setNarration]             = useState("");
  const [bankSearch, setBankSearch]           = useState("");
  const [showBankModal, setShowBankModal]     = useState(false);
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [showOtpSheet, setShowOtpSheet]       = useState(false);
  const [otp, setOtp]                         = useState("");
  const [otpSent, setOtpSent]                 = useState(false);
  const [otpCooldown, setOtpCooldown]         = useState(0);
  const [showSuccess, setShowSuccess]         = useState(false);
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([]);
  const [showRecent, setShowRecent]           = useState(false);

  const { data: bankListData, isLoading: loadingBanks } = useGetBankListQuery();
  const { data: feeSettings }                           = useGetFeeSettingsQuery();
  const [resolveAccount]                                = useResolveAccountMutation();
  const [sendOtp, { isLoading: sendingOtp }]            = useSendWithdrawalOtpMutation();
  const [submitWithdrawal, { isLoading: submitting }]   = useSubmitWithdrawalMutation();

  const banks           = bankListData?.data ?? [];
  const filteredBanks   = banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()));
  const feeType         = feeSettings?.fee_type       ?? "flat";
  const feeAmount       = feeSettings?.fee_amount     ?? 0;
  const minAmount       = feeSettings?.min_withdrawal ?? 0;
  const maxAmount       = feeSettings?.max_withdrawal ?? 0;
  const parsedAmount    = parseFloat(amount) || 0;
  const fee             = feeType === "percent" ? (parsedAmount * feeAmount) / 100 : feeAmount;
  const amountToReceive = parsedAmount - fee;

  // ─── All original effects — untouched ────────────────────────────────────
  useEffect(() => { getRecentRecipients().then(setRecentRecipients); }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setInterval(() => setOtpCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [otpCooldown]);

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) handleResolve();
    else setAccountName("");
  }, [accountNumber, selectedBank]);

  // ─── All original handlers — untouched ───────────────────────────────────
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
        payload.biometric       = true;
        payload.biometric_token = Crypto.randomUUID();
      } catch { showToast({ variant: "error", message: "Biometric failed." }); return; }
    }
    try {
      const result = await submitWithdrawal(payload).unwrap();
      if (result.success) {
        setShowSuccess(true);
        await dispatch(authSliceActions.fetchUserProfile());
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
      const message = data?.error ?? data?.message ?? data?.errors?.[0] ?? "Transfer failed. Please try again.";
      if (status === 403)      showToast({ variant: "warning", message: "Your account is blocked. Contact support." });
      else if (status === 422) { showToast({ variant: "warning", message }); if (message.toLowerCase().includes("otp")) setOtp(""); }
      else if (status === 400) showToast({ variant: "warning", message });
      else if (status === 429) showToast({ variant: "warning", message: "Too many attempts. Please wait and try again." });
      else                     showToast({ variant: "error", message });
    }
  };

  const quickAmounts = [1000, 5000, 10000];

  // ─── Initials helper ─────────────────────────────────────────────────────
  const initials = (name: string) =>
    name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  // =========================================================================
  // SUCCESS SCREEN
  // =========================================================================
  if (showSuccess) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={s.successWrap}>
          {/* Checkmark ring */}
          <View style={s.successRing}>
            <View style={s.successIcon}>
              <MaterialCommunityIcons name="check" size={36} color="#fff" />
            </View>
          </View>

          <Text style={s.successTitle}>Transfer Sent</Text>
          <Text style={s.successAmount}>₦{parsedAmount.toLocaleString()}.00</Text>
          <Text style={s.successSub}>Your money is on its way</Text>

          {/* Receipt card */}
          <View style={s.receiptCard}>
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>To</Text>
              <View style={s.recipientRow}>
                <View style={s.recipientAvatar}>
                  <Text style={s.recipientInitials}>{initials(accountName)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.recipientName}>{accountName}</Text>
                  <Text style={s.recipientMeta}>{accountNumber} · {selectedBank?.name}</Text>
                </View>
              </View>
            </View>
            {narration ? (
              <>
                <View style={s.receiptDivider} />
                <View style={s.receiptRow}>
                  <Text style={s.receiptLabel}>Note</Text>
                  <Text style={s.receiptValue}>{narration}</Text>
                </View>
              </>
            ) : null}
          </View>

          <TouchableOpacity style={s.doneBtn} onPress={() => navigation.navigate("Dashboard")} activeOpacity={0.85}>
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // REVIEW SCREEN
  // =========================================================================
  if (step === "review") {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />

        {/* Nav bar */}
        <View style={s.navBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep("form")} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={BRAND} />
          </TouchableOpacity>
          <View style={s.navCenter}>
            <Text style={s.navTitle}>Review Transfer</Text>
            <Text style={s.navSub}>Confirm details below</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Recipient */}
          <Text style={s.sectionHeader}>Recipient</Text>
          <View style={s.iosCard}>
            <View style={s.recipientRow}>
              <View style={s.recipientAvatarLg}>
                <Text style={s.recipientInitialsLg}>{initials(accountName)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.recipientNameLg}>{accountName}</Text>
                <Text style={s.recipientMetaSm}>{accountNumber}</Text>
                <Text style={s.recipientMetaSm}>{selectedBank?.name}</Text>
              </View>
            </View>
          </View>

          {/* Transfer details */}
          <Text style={s.sectionHeader}>Transfer Details</Text>
          <View style={s.iosCard}>
            <ReviewRow label="Amount"           value={`₦${parsedAmount.toLocaleString()}`} />
            <View style={s.cardSeparator} />
            <ReviewRow label="Transaction Fee"  value={fee === 0 ? "Free 🎉" : `₦${fee.toLocaleString()}`} />
            <View style={s.cardSeparatorFull} />
            <ReviewRow label="Total Deducted"   value={`₦${(parsedAmount + fee).toLocaleString()}`} bold />
          </View>

          {narration ? (
            <>
              <Text style={s.sectionHeader}>Note</Text>
              <View style={s.iosCard}>
                <Text style={s.narrationValue}>{narration}</Text>
              </View>
            </>
          ) : null}

          {/* Security note */}
          <View style={s.secureNote}>
            <MaterialCommunityIcons name="lock-outline" size={15} color={BLUE} />
            <Text style={s.secureText}>Protected by bank-grade 256-bit encryption</Text>
          </View>
        </ScrollView>

        {/* OTP bottom sheet */}
        {showOtpSheet ? (
          <View style={[s.otpSheet, { paddingBottom: insets.bottom + 20 }]}>
            {/* Pull handle */}
            <View style={s.sheetHandle} />
            <Text style={s.otpTitle}>Confirm Transfer</Text>
            <Text style={s.otpSub}>Enter the OTP sent to your email</Text>

            <View style={s.otpRow}>
              <TextInput
                style={s.otpInput}
                placeholder="· · · · · ·"
                placeholderTextColor={PLACEHOLDER}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <TouchableOpacity
                style={[s.sendOtpBtn, (sendingOtp || otpCooldown > 0) && s.disabledOpacity]}
                onPress={handleSendOtp}
                disabled={sendingOtp || otpCooldown > 0}
                activeOpacity={0.75}
              >
                <Text style={s.sendOtpText}>
                  {otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Resend" : "Send OTP"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.primaryBtn, (!otp || submitting) && s.disabledOpacity]}
              onPress={() => handleSubmit("otp")}
              disabled={!otp || submitting}
              activeOpacity={0.85}
            >
              <Text style={s.primaryBtnText}>{submitting ? "Processing…" : "Confirm & Send"}</Text>
            </TouchableOpacity>

            {/* Biometric */}
            <TouchableOpacity style={s.biometricRow} onPress={() => handleSubmit("biometric")} activeOpacity={0.7}>
              <View style={s.biometricIconWrap}>
                <MaterialCommunityIcons name="fingerprint" size={28} color={BLUE} />
              </View>
              <Text style={s.biometricLabel}>Use Face ID / Touch ID</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelLink} onPress={() => setShowOtpSheet(false)} activeOpacity={0.6}>
              <Text style={s.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={s.primaryBtn} onPress={() => setShowOtpSheet(true)} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Confirm & Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // =========================================================================
  // FORM SCREEN
  // =========================================================================
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Nav bar */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={BRAND} />
        </TouchableOpacity>
        <View style={s.navCenter}>
          <Text style={s.navTitle}>Send Money</Text>
          <Text style={s.navSub}>To any Nigerian bank</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Recent recipients ── */}
          {recentRecipients.length > 0 && (
            <View style={s.recentWrap}>
              <TouchableOpacity style={s.recentHeader} onPress={() => setShowRecent(v => !v)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="history" size={14} color={BLUE} />
                <Text style={s.recentHeaderText}>Recent</Text>
                <MaterialCommunityIcons name={showRecent ? "chevron-up" : "chevron-down"} size={14} color={SUBLABEL} />
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
                      activeOpacity={0.7}
                    >
                      <View style={s.recentAvatar}>
                        <Text style={s.recentInitials}>{initials(r.account_name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.recentName}>{r.account_name}</Text>
                        <Text style={s.recentMeta}>{r.account_number} · {r.bank_name}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={PLACEHOLDER} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Receiver details card ── */}
          <Text style={s.sectionHeader}>Receiver</Text>
          <View style={s.iosCard}>
            {/* Account Number */}
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Account No.</Text>
              <TextInput
                style={s.fieldInput}
                placeholder="10-digit number"
                placeholderTextColor={PLACEHOLDER}
                value={accountNumber}
                onChangeText={v => setAccountNumber(v.replace(/\D/g, "").slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            {/* Beneficiary suggestion inline */}
            {matchedRecipient && accountNumber !== matchedRecipient.account_number && (
              <TouchableOpacity
                style={s.suggestionBanner}
                onPress={() => {
                  setAccountNumber(matchedRecipient.account_number);
                  setAccountName(matchedRecipient.account_name);
                  setSelectedBank({ name: matchedRecipient.bank_name, code: matchedRecipient.bank_code });
                }}
                activeOpacity={0.8}
              >
                <View style={s.suggestionAvatar}>
                  <Text style={s.suggestionInitials}>{initials(matchedRecipient.account_name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.suggestionName}>{matchedRecipient.account_name}</Text>
                  <Text style={s.suggestionMeta}>{matchedRecipient.account_number} · {matchedRecipient.bank_name}</Text>
                </View>
                <Text style={s.suggestionUse}>Use</Text>
              </TouchableOpacity>
            )}

            <View style={s.cardSeparator} />

            {/* Bank selector */}
            <TouchableOpacity style={s.fieldRow} onPress={() => setShowBankModal(true)} activeOpacity={0.7}>
              <Text style={s.fieldLabel}>Bank</Text>
              <View style={s.fieldInputRow}>
                <Text style={[s.fieldInput, !selectedBank && { color: PLACEHOLDER }]} numberOfLines={1}>
                  {selectedBank ? selectedBank.name : "Select bank"}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={PLACEHOLDER} />
              </View>
            </TouchableOpacity>

            <View style={s.cardSeparator} />

            {/* Account name */}
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Account Name</Text>
              {isResolvingName
                ? <Text style={s.resolvingText}>Verifying…</Text>
                : <Text style={[s.fieldInput, !accountName && { color: PLACEHOLDER }]} numberOfLines={1}>
                    {accountName || "Auto-filled"}
                  </Text>
              }
            </View>
          </View>

          {/* ── Balance pill ── */}
          <View style={s.balancePill}>
            <MaterialCommunityIcons name="wallet-outline" size={13} color={BLUE} />
            <Text style={s.balancePillText}>
              Balance: ₦{parseFloat(nairaBalance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* ── Amount card ── */}
          <Text style={s.sectionHeader}>Amount</Text>
          <View style={s.iosCard}>
            <View style={s.amountRow}>
              <Text style={s.amountCurrencySymbol}>₦</Text>
              <TextInput
                style={s.amountInput}
                placeholder="0.00"
                placeholderTextColor={PLACEHOLDER}
                value={amount}
                onChangeText={v => setAmount(v.replace(/[^0-9.]/g, ""))}
                keyboardType="numeric"
              />
            </View>
            <View style={s.cardSeparator} />
            <View style={s.quickRow}>
              {quickAmounts.map(v => (
                <TouchableOpacity
                  key={v}
                  style={[s.quickChip, amount === String(v) && s.quickChipActive]}
                  onPress={() => setAmount(String(v))}
                  activeOpacity={0.75}
                >
                  <Text style={[s.quickChipText, amount === String(v) && s.quickChipTextActive]}>
                    ₦{v >= 1000 ? `${v / 1000}k` : v}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={s.quickChip}
                onPress={() => setAmount(nairaBalance)}
                activeOpacity={0.75}
              >
                <Text style={s.quickChipText}>Max</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fee preview */}
          {parsedAmount > 0 && (
            <View style={[s.feePreview, fee === 0 && s.feePreviewFree]}>
              <MaterialCommunityIcons
                name={fee === 0 ? "gift-outline" : "information-outline"}
                size={14}
                color={fee === 0 ? SUCCESS : BRAND}
              />
              <Text style={[s.feePreviewText, fee === 0 && { color: SUCCESS }]}>
                {fee === 0 ? "Free transfer — no fees!" : `Fee: ₦${fee.toLocaleString()}`}
              </Text>
            </View>
          )}

          {/* ── Narration card ── */}
          <Text style={s.sectionHeader}>
            Note <Text style={s.optionalLabel}>(Optional)</Text>
          </Text>
          <View style={s.iosCard}>
            <View style={s.narrationRow}>
              <TextInput
                style={s.narrationInput}
                placeholder="What's this for?"
                placeholderTextColor={PLACEHOLDER}
                value={narration}
                onChangeText={v => setNarration(v.slice(0, 50))}
                maxLength={50}
              />
              <Text style={s.narrationCount}>{narration.length}/50</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer CTA */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[s.primaryBtn, !!formError() && s.disabledOpacity]}
          onPress={handleContinue}
          disabled={!!formError()}
          activeOpacity={0.85}
        >
          <Text style={s.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bank picker modal ── */}
      <Modal visible={showBankModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={s.modalOverlay}>
          <View style={[s.bankSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Select Bank</Text>

            <View style={s.searchWrap}>
              <MaterialCommunityIcons name="magnify" size={16} color={PLACEHOLDER} />
              <TextInput
                style={s.searchInput}
                placeholder="Search banks…"
                placeholderTextColor={PLACEHOLDER}
                value={bankSearch}
                onChangeText={setBankSearch}
                autoFocus
              />
              {bankSearch.length > 0 && (
                <TouchableOpacity onPress={() => setBankSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={PLACEHOLDER} />
                </TouchableOpacity>
              )}
            </View>

            {loadingBanks ? (
              <Text style={s.loadingText}>Loading banks…</Text>
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={item => item.code}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={s.listSeparator} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[s.bankItem, selectedBank?.code === item.code && s.bankItemActive]}
                    onPress={() => { setSelectedBank(item); setBankSearch(""); setShowBankModal(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.bankItemText, selectedBank?.code === item.code && s.bankItemTextActive]}>
                      {item.name}
                    </Text>
                    {selectedBank?.code === item.code && (
                      <MaterialCommunityIcons name="checkmark-circle" size={18} color={BLUE} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowBankModal(false)} activeOpacity={0.8}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-components — untouched logic ────────────────────────────────────────
function ReviewRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.reviewRow}>
      <Text style={s.reviewLabel}>{label}</Text>
      <Text style={[s.reviewValue, bold && s.reviewValueBold]}>{value}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const IOS_SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
});

const IOS_SHEET_SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
  },
  android: { elevation: 16 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Nav bar ──────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: SURFACE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BLUE_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  navCenter:  { flex: 1, alignItems: "center" },
  navTitle:   { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:     { fontSize: 11, color: SUBLABEL, marginTop: 1 },

  // ── iOS grouped card ─────────────────────────────────────────────────────
  iosCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    marginBottom: 6,
    overflow: "hidden",
    ...IOS_SHADOW,
  },
  cardSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEPARATOR,
    marginLeft: 16,
  },
  cardSeparatorFull: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEPARATOR,
  },

  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: SUBLABEL,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 14,
    marginLeft: 4,
  },
  optionalLabel: { fontWeight: "400", color: PLACEHOLDER, textTransform: "none", letterSpacing: 0 },

  // ── Form fields ──────────────────────────────────────────────────────────
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 50,
  },
  fieldInputRow:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  fieldLabel:     { fontSize: 15, color: LABEL, fontWeight: "400", width: 110 },
  fieldInput:     { flex: 1, fontSize: 15, color: LABEL, textAlign: "right" },
  resolvingText:  { fontSize: 14, color: PLACEHOLDER, fontStyle: "italic" },

  // ── Suggestion ───────────────────────────────────────────────────────────
  suggestionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: BLUE_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BLUE_MID,
  },
  suggestionAvatar:   { width: 30, height: 30, borderRadius: 15, backgroundColor: BLUE, justifyContent: "center", alignItems: "center" },
  suggestionInitials: { fontSize: 11, fontWeight: "700", color: "#fff" },
  suggestionName:     { fontSize: 13, fontWeight: "600", color: BRAND },
  suggestionMeta:     { fontSize: 11, color: SUBLABEL },
  suggestionUse:      { fontSize: 13, fontWeight: "700", color: BLUE },

  // ── Balance pill ─────────────────────────────────────────────────────────
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: BLUE_LIGHT,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
    marginTop: 6,
  },
  balancePillText: { fontSize: 12, color: BLUE, fontWeight: "600" },

  // ── Amount ───────────────────────────────────────────────────────────────
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  amountCurrencySymbol: { fontSize: 26, fontWeight: "300", color: SUBLABEL, marginRight: 4 },
  amountInput:          { flex: 1, fontSize: 32, fontWeight: "700", color: LABEL, letterSpacing: -0.5 },
  quickRow:             { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 12, flexWrap: "wrap" },
  quickChip:            { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: BG, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  quickChipActive:      { backgroundColor: BLUE },
  quickChipText:        { fontSize: 13, fontWeight: "600", color: SUBLABEL },
  quickChipTextActive:  { color: "#fff" },

  // ── Fee preview ──────────────────────────────────────────────────────────
  feePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BLUE_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 6,
  },
  feePreviewFree: { backgroundColor: "#F0FDF4" },
  feePreviewText: { fontSize: 13, color: BRAND, fontWeight: "500" },

  // ── Narration ────────────────────────────────────────────────────────────
  narrationRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  narrationInput:{ flex: 1, fontSize: 15, color: LABEL },
  narrationCount:{ fontSize: 12, color: PLACEHOLDER },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: SURFACE,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SEPARATOR,
    ...IOS_SHEET_SHADOW,
  },

  // ── Primary button ───────────────────────────────────────────────────────
  primaryBtn:     { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: -0.2 },
  disabledOpacity:{ opacity: 0.45 },

  // ── Review screen ────────────────────────────────────────────────────────
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  reviewLabel:     { fontSize: 15, color: SUBLABEL },
  reviewValue:     { fontSize: 15, fontWeight: "500", color: LABEL },
  reviewValueBold: { fontWeight: "700", color: BRAND },

  // ── Recipient shared ─────────────────────────────────────────────────────
  recipientRow:       { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  recipientAvatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  recipientInitials:  { fontSize: 13, fontWeight: "700", color: BLUE },
  recipientName:      { fontSize: 14, fontWeight: "600", color: LABEL },
  recipientMeta:      { fontSize: 12, color: SUBLABEL },
  // larger variant for review
  recipientAvatarLg:  { width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  recipientInitialsLg:{ fontSize: 15, fontWeight: "700", color: BLUE },
  recipientNameLg:    { fontSize: 15, fontWeight: "600", color: LABEL },
  recipientMetaSm:    { fontSize: 12, color: SUBLABEL, marginTop: 1 },

  // ── Secure note ──────────────────────────────────────────────────────────
  secureNote:  { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingVertical: 8 },
  secureText:  { fontSize: 12, color: SUBLABEL },

  // ── OTP sheet ────────────────────────────────────────────────────────────
  otpSheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    ...IOS_SHEET_SHADOW,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: SEPARATOR, alignSelf: "center", marginBottom: 18 },
  otpTitle:    { fontSize: 18, fontWeight: "700", color: BRAND, textAlign: "center", marginBottom: 4 },
  otpSub:      { fontSize: 13, color: SUBLABEL, textAlign: "center", marginBottom: 20 },
  otpRow:      { flexDirection: "row", gap: 10, marginBottom: 14 },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 8,
    color: LABEL,
    backgroundColor: BG,
  },
  sendOtpBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: "center",
  },
  sendOtpText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  biometricRow:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  biometricIconWrap:{ width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  biometricLabel:  { fontSize: 14, color: BLUE, fontWeight: "600" },
  cancelLink:      { alignItems: "center", paddingVertical: 6 },
  cancelLinkText:  { fontSize: 15, color: PLACEHOLDER },

  // ── Bank modal ───────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  bankSheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: "82%",
    ...IOS_SHEET_SHADOW,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: BRAND, marginBottom: 14 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: LABEL },
  loadingText: { textAlign: "center", color: PLACEHOLDER, padding: 24 },
  listSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 16 },
  bankItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    minHeight: 50,
  },
  bankItemActive:    { backgroundColor: BLUE_LIGHT, borderRadius: 10, paddingHorizontal: 8 },
  bankItemText:      { fontSize: 15, color: LABEL },
  bankItemTextActive:{ color: BLUE, fontWeight: "600" },
  modalCancelBtn:    { marginTop: 12, paddingVertical: 14, alignItems: "center", backgroundColor: BG, borderRadius: 14 },
  modalCancelText:   { fontSize: 16, fontWeight: "600", color: SUBLABEL },

  // ── Recent recipients ────────────────────────────────────────────────────
  recentWrap:       { marginBottom: 10 },
  recentHeader:     { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  recentHeaderText: { fontSize: 13, color: BLUE, fontWeight: "600", flex: 1 },
  recentList:       { backgroundColor: SURFACE, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, overflow: "hidden", ...IOS_SHADOW },
  recentItem:       { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 58 },
  recentItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  recentAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  recentInitials:   { fontSize: 13, fontWeight: "700", color: BLUE },
  recentName:       { fontSize: 14, fontWeight: "600", color: LABEL },
  recentMeta:       { fontSize: 12, color: SUBLABEL, marginTop: 2 },

  // ── Narration value (review) ─────────────────────────────────────────────
  narrationValue: { fontSize: 15, color: LABEL, paddingHorizontal: 16, paddingVertical: 14 },

  // ── Success screen ───────────────────────────────────────────────────────
  successWrap:   { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  successRing:   { width: 88, height: 88, borderRadius: 44, backgroundColor: "#DCFCE7", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  successIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: SUCCESS, justifyContent: "center", alignItems: "center" },
  successTitle:  { fontSize: 22, fontWeight: "800", color: BRAND, letterSpacing: -0.4, marginBottom: 6 },
  successAmount: { fontSize: 36, fontWeight: "800", color: LABEL, letterSpacing: -1, marginBottom: 4 },
  successSub:    { fontSize: 14, color: SUBLABEL, marginBottom: 28 },
  receiptCard: {
    width: "100%",
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SEPARATOR,
    marginBottom: 28,
    overflow: "hidden",
    ...IOS_SHADOW,
  },
  receiptRow:     { paddingHorizontal: 16, paddingVertical: 14 },
  receiptDivider: { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR },
  receiptLabel:   { fontSize: 12, color: SUBLABEL, marginBottom: 6 },
  receiptValue:   { fontSize: 14, fontWeight: "600", color: LABEL },
  doneBtn:        { width: "100%", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  doneBtnText:    { fontSize: 16, fontWeight: "700", color: "#fff" },
});
