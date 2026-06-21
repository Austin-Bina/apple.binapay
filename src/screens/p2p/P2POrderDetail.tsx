import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
  Clipboard,
  TouchableOpacity,
} from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import {
  useGetP2POrderDetailQuery,
  useGetP2POrderMessagesQuery,
  useSendP2PMessageMutation,
  useMarkOrderAsPaidMutation,
  useReleaseOrderMutation,
  useMarkMessagesReadMutation,
  useVerifyOrderDetailsMutation,
  useGetUserP2PSettingsQuery,
  P2PMessage,
} from "@store/redux-api/p2p";
import { useIsFocused } from "@react-navigation/native";
import { showToast } from "@helpers/toast";
import { useGetBankListQuery } from "@store/redux-api/fundsApi";

type Props = P2PStackScreenProps<"P2P Order Detail">;

const BRAND = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";

export default function P2POrderDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { orderId } = route.params as { orderId: string };

  const [messageText, setMessageText]           = useState("");
  const [showChat, setShowChat]                 = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const chatScrollRef = useRef<FlatList>(null);

  const { data, isLoading, isError, refetch: refetchOrder } = useGetP2POrderDetailQuery(orderId);
  const { data: messagesData, refetch: refetchMessages, isFetching: isFetchingMessages } =
    useGetP2POrderMessagesQuery(orderId, { skip: !showChat });
  const [sendMessage, { isLoading: isSending }]        = useSendP2PMessageMutation();
  const [markAsPaid, { isLoading: isMarkingPaid }]     = useMarkOrderAsPaidMutation();
  const [releaseOrder, { isLoading: isReleasing }]     = useReleaseOrderMutation();
  const [markMessagesRead]                             = useMarkMessagesReadMutation();

  const [showVerifyModal, setShowVerifyModal]         = useState(false);
  const [manualAccountNo, setManualAccountNo]         = useState("");
  const [manualBankCode, setManualBankCode]           = useState("");
  const [manualAmount, setManualAmount]               = useState("");
  const [verifiedAccountName, setVerifiedAccountName] = useState<string | null>(null);
  const [verifyOrderDetails, { isLoading: isVerifying }] = useVerifyOrderDetailsMutation();
  const [selectedVerifyBank, setSelectedVerifyBank]   = useState<{ name: string; code: string } | null>(null);
  const [showBankPickerModal, setShowBankPickerModal] = useState(false);
  const [bankSearch, setBankSearch]                   = useState("");
  const { data: bankListData }                        = useGetBankListQuery();
  const banks                                         = bankListData?.data ?? [];
  const filteredBanks                                 = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );
  const { data: userSettingsData } = useGetUserP2PSettingsQuery();
  const feeEnabled  = userSettingsData?.settings?.fee_enabled ?? false;
  const defaultFee  = userSettingsData?.settings?.fee_amount  ?? "0";

  const [manualFee, setManualFee] = useState("");
  const isFocused = useIsFocused();

  const order    = data?.order;
  const messages = messagesData?.messages ?? [];

  const isBuy  = order?.type === "Buy";
  const isSell = order?.type === "Sell";
  const status = order?.status;

  // ── Action button logic ──────────────────────────────────────────────────
  const showMarkPaid   = isBuy  && status === "unpaid";
  const showRelease    = isSell && status === "paid";
  const showDispute    =  (isBuy && status === "paid") || (isSell && status === "paid");
  const showAnyActions = showMarkPaid || showRelease || showDispute;

  // "Process" button: always visible for Buy + unpaid (alongside Mark as Paid)
  const showProcess = isBuy && status === "unpaid";

  const statusColor =
    status === "paid"      ? "#F5A623" :
    status === "unpaid"    ? "#f5e023" :
    status === "completed" ? "#2E7D32" : "#E53935";

  const statusBg =
    status === "paid"      ? "#FFF3E0" :
    status === "cancelled" ? "#F5F5F5" :
    status === "completed" ? "#E8F5E9" : "#FFEBEE";

  const statusLabel =
    status === "unpaid"    ? "Awaiting Payment" :
    status === "paid"      ? "Awaiting Release" :
    status === "completed" ? "Completed"        :
    status === "cancelled" ? "Cancelled"        :
    status === "appealing" ? "Appealing"        : "Unknown";

  // ── Open the process/verify modal ────────────────────────────────────────
  // Always pre-fills whatever we have; works whether verified or not
  const openProcessModal = () => {
    setManualAccountNo(order?.account_number ?? "");
    setSelectedVerifyBank(
      order?.bank_code && order?.bank_name
        ? { code: order.bank_code, name: order.bank_name }
        : null
    );
    // If already verified, pre-show the verified name so user sees confirmation
    setVerifiedAccountName(order?.is_verified ? (order?.account_name ?? null) : null);
    setManualFee(defaultFee ?? "0");
    setShowVerifyModal(true);
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text) return;
    try {
      await sendMessage({ orderId, message: text }).unwrap();
      setMessageText("");
      refetchMessages();
    } catch (err: any) {
      showToast({ message: err?.data?.message ?? "Failed to send message.", duration: 2500 });
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await markAsPaid(orderId).unwrap();
      showToast({ message: "Order marked as paid successfully.", duration: 2000 });
      refetchOrder();
    } catch (err: any) {
      showToast({
        message: err?.data?.message ?? "Failed to mark order as paid. Please try again.",
        duration: 3000,
      });
    }
  };

  const handleReleaseConfirmed = async () => {
    setShowReleaseModal(false);
    try {
      await releaseOrder(orderId).unwrap();
      showToast({ message: "Order released successfully.", duration: 2000 });
      setTimeout(() => navigation.goBack(), 500);
    } catch (err: any) {
      showToast({
        message: err?.data?.message ?? "Failed to release order. Please try again.",
        duration: 3000,
      });
    }
  };

  const copyToClipboard = (value: string, label: string) => {
    Clipboard.setString(value);
    showToast({ message: `${label} copied`, duration: 1500 });
  };

  const resetVerifyModal = () => {
    setShowVerifyModal(false);
    setVerifiedAccountName(null);
    setSelectedVerifyBank(null);
    setManualAccountNo("");
    setManualFee("");
  };

  useEffect(() => {
    if (orderId && showChat) {
      markMessagesRead(orderId);
    }
  }, [orderId, showChat]);

  useEffect(() => {
    if (isFocused) {
      refetchOrder();
    }
  }, [isFocused]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => chatScrollRef.current?.scrollToEnd?.({ animated: true }), 100);
    }
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}>

      <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableRipple onPress={() => navigation.goBack()} style={styles.backBtn} borderless>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
          </TouchableRipple>
          <Text style={styles.headerText}>Trade</Text>
          <TouchableRipple
            style={styles.chatToggleBtn}
            onPress={() => setShowChat((v) => !v)}
            borderless>
            <MaterialCommunityIcons
              name={showChat ? "information-outline" : "chat-outline"}
              size={24}
              color={BRAND}
            />
          </TouchableRipple>
        </View>

        {/* ── Loading ── */}
        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={BRAND} />
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        )}

        {/* ── Error ── */}
        {isError && (
          <View style={styles.loadingWrap}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#E53935" />
            <Text style={styles.errorText}>Failed to load order details.</Text>
            <TouchableRipple style={styles.retryBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.retryText}>Go Back</Text>
            </TouchableRipple>
          </View>
        )}

        {/* ── Order Detail View ── */}
        {order && !showChat && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            <View style={styles.summaryCard}>
              <View style={styles.coinRow}>
                <View style={styles.coinCircle}>
                  <Text style={styles.coinCircleText}>{order.coin?.charAt(0) ?? "T"}</Text>
                </View>
                <View>
                  <Text style={styles.summaryTitle}>
                    {order.type}{" "}
                    <Text style={styles.summaryAmount}>{order.quantity} {order.coin}</Text>
                  </Text>
                  <Text style={styles.summaryDate}>{order.created_at ?? ""}</Text>
                </View>
              </View>
            </View>

            {(order.payment_method || order.account_number) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Information</Text>
                <View style={styles.sectionCard}>
                  <View style={styles.paymentRow}>
                    <View style={styles.paymentIconBox}>
                      <MaterialCommunityIcons name="bank-outline" size={20} color={BRAND} />
                    </View>
                    <View>
                      <Text style={styles.paymentMethodName}>
                        {order.bank_name ?? order.payment_method ?? "—"}
                      </Text>
                      <TouchableOpacity
                        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                        onPress={() => copyToClipboard(order.account_number ?? "", "Account number")}>
                        <Text style={styles.paymentAccountNo}>{order.account_number ?? "—"}</Text>
                        <MaterialCommunityIcons name="content-copy" size={12} color="#BBB" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {order.account_name && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.infoRow}>
                        <TouchableOpacity onPress={() => copyToClipboard(order.account_name ?? "", "Account name")}>
                          <Text style={styles.infoValue}>{order.account_name}</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>

                {/* Verify banner — only shown when NOT verified OR fee was declined */}
                {order.type === "Buy" && order.status === "unpaid" &&
                  (!order.is_verified || order.minus_fee === false) && (
                  <TouchableRipple
                    style={styles.verifyBanner}
                    onPress={openProcessModal}>
                    <View style={styles.verifyBannerInner}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#F5A623" />
                      <Text style={styles.verifyBannerText}>
                        {order.minus_fee === false
                          ? "Fee declined — tap to negotiate a new fee"
                          : "Account not verified — tap to verify manually"}
                      </Text>
                      <MaterialCommunityIcons name="chevron-right" size={16} color="#F5A623" />
                    </View>
                  </TouchableRipple>
                )}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <TouchableOpacity onPress={() => copyToClipboard(order.amount ?? "", "Amount")}>
                    <Text style={styles.infoValueBold}>₦{order.amount}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text style={styles.infoValue}>₦{order.price}/{order.coin}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Quantity</Text>
                  <Text style={styles.infoValue}>{order.quantity} {order.coin}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Order No.</Text>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                    onPress={() => copyToClipboard(order.order_no ?? order.id, "Order No.")}>
                    <Text style={[styles.infoValue, styles.monoText]}>{order.order_no ?? order.id}</Text>
                    <MaterialCommunityIcons name="content-copy" size={12} color="#BBB" />
                  </TouchableOpacity>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Exchange</Text>
                  <View style={styles.exchangeRow}>
                    <View style={styles.exchangeDot}>
                      <Text style={styles.exchangeDotText}>B</Text>
                    </View>
                    <Text style={styles.infoValue}>Bybit</Text>
                  </View>
                </View>
                {!!order.transfer_last_seconds && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <View style={styles.releaseTimeLabel}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color="#888" />
                        <Text style={styles.infoLabel}>Avg. Release Time</Text>
                      </View>
                      <Text style={[styles.infoValue, { color: "#F5A623", fontWeight: "700" }]}>
                        {Math.round(order.transfer_last_seconds / 60)} mins
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressTrack}>
                <View style={[
                  styles.progressFill,
                  {
                    width: status === "completed" ? "100%" :
                           status === "paid"      ? "65%"  : "30%",
                  }
                ]} />
              </View>
              <Text style={styles.progressLabel}>
                {status === "unpaid"    ? "Waiting for buyer to make payment" :
                 status === "paid"      ? "Payment sent. Waiting for seller to release" :
                 status === "completed" ? "Order completed successfully" :
                 "Order is under appeal"}
              </Text>
            </View>

            <TouchableRipple style={styles.chatHint} onPress={() => setShowChat(true)}>
              <View style={styles.chatHintInner}>
                <MaterialCommunityIcons name="chat-outline" size={18} color={BRAND} />
                <Text style={styles.chatHintText}>View chat with counterparty</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={BRAND} />
              </View>
            </TouchableRipple>

          </ScrollView>
        )}

        {/* ── Chat View ── */}
        {order && showChat && (
          <View style={styles.chatContainer}>
            {isFetchingMessages && messages.length === 0 ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={BRAND} />
                <Text style={styles.loadingText}>Loading messages...</Text>
              </View>
            ) : (
              <FlatList
                ref={chatScrollRef}
                data={messages}
                keyExtractor={(item, index) => item.id ?? String(index)}
                contentContainerStyle={styles.messagesList}
                ListEmptyComponent={
                  <View style={styles.emptyChat}>
                    <MaterialCommunityIcons name="chat-sleep-outline" size={40} color="#D0D9EE" />
                    <Text style={styles.emptyChatText}>No messages yet</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item}
                    myBybitUid={messagesData?.my_bybit_uid ?? null}
                  />
                )}
                onContentSizeChange={() =>
                  chatScrollRef.current?.scrollToEnd({ animated: false })
                }
              />
            )}


           <View style={styles.chatUtilityRow}>
  <TouchableRipple
    style={styles.refreshBtn}
    onPress={() => refetchMessages()}
    disabled={isFetchingMessages}>
    <View style={styles.refreshBtnInner}>
      <MaterialCommunityIcons
        name="refresh"
        size={14}
        color={isFetchingMessages ? "#AAA" : BRAND}
      />
      <Text style={[styles.refreshBtnText, isFetchingMessages && { color: "#AAA" }]}>
        {isFetchingMessages ? "Refreshing..." : "Refresh messages"}
      </Text>
    </View>
  </TouchableRipple>
{showProcess && (
    <TouchableRipple
      style={styles.chatProcessBtn}
      onPress={openProcessModal}>
      <View style={styles.refreshBtnInner}>
        <MaterialCommunityIcons name="cog-outline" size={14} color={BRAND} />
        <Text style={styles.refreshBtnText}>Process</Text>
      </View>
    </TouchableRipple>
  )}
</View>


            <View style={styles.inputRow}>
              <TextInput
                style={styles.messageInput}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message..."
                placeholderTextColor="#BBB"
                multiline
                maxLength={500}
              />
              <TouchableRipple
                style={[styles.sendBtn, (!messageText.trim() || isSending) && styles.sendBtnDisabled]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || isSending}
                borderless>
                {isSending
                  ? <ActivityIndicator size={18} color="#fff" />
                  : <MaterialCommunityIcons name="send" size={18} color="#fff" />}
              </TouchableRipple>
            </View>
          </View>
        )}

        {/* ── Bottom Actions ── */}
        {order && !showChat && showAnyActions && (
          <View style={styles.bottomActions}>
            <View style={styles.actionRow}>

              {/* Mark as Paid + Process — Buy + unpaid only */}
              {showMarkPaid && (
                <View style={styles.markPaidGroup}>
                  {/* Mark as Paid (primary, takes most space) */}
                  <TouchableRipple
                    style={[styles.primaryBtn, isMarkingPaid && styles.btnDisabled]}
                    onPress={handleMarkAsPaid}
                    disabled={isMarkingPaid}>
                    <View style={styles.btnInner}>
                      {isMarkingPaid
                        ? <ActivityIndicator size={16} color="#fff" />
                        : <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />}
                      <Text style={styles.primaryBtnText}>
                        {isMarkingPaid ? "Processing..." : "Mark as Paid"}
                      </Text>
                    </View>
                  </TouchableRipple>

                  {/* Process button (small, secondary) */}
                  <TouchableRipple
                    style={styles.processBtn}
                    onPress={openProcessModal}>
                    <View style={styles.btnInner}>
                      <MaterialCommunityIcons name="cog-outline" size={15} color={BRAND} />
                      <Text style={styles.processBtnText}>Process</Text>
                    </View>
                  </TouchableRipple>
                </View>
              )}

              {/* Release Coin */}
              {showRelease && (
                <TouchableRipple
                  style={[styles.releaseBtn, isReleasing && styles.btnDisabled]}
                  onPress={() => setShowReleaseModal(true)}
                  disabled={isReleasing}>
                  <View style={styles.btnInner}>
                    {isReleasing
                      ? <ActivityIndicator size={16} color="#fff" />
                      : <MaterialCommunityIcons name="send-circle-outline" size={18} color="#fff" />}
                    <Text style={styles.releaseBtnText}>
                      {isReleasing ? "Releasing..." : "Release Coin"}
                    </Text>
                  </View>
                </TouchableRipple>
              )}

              {/* Chat / Dispute */}
              {showDispute && (
                <TouchableRipple
                  style={[styles.disputeBtn, (showMarkPaid || showRelease) && styles.disputeBtnSmall]}
                  onPress={() => setShowChat(true)}>
                  <Text style={styles.disputeText}>Chat</Text>
                </TouchableRipple>
              )}

            </View>
          </View>
        )}

      </View>

      {/* ── Verify / Process Modal ── */}
      <Modal visible={showVerifyModal} transparent animationType="slide">
        <View style={styles.bsOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={resetVerifyModal} />
          <View style={styles.bsCard}>
            <View style={styles.bsHandle} />
            <Text style={styles.bsTitle}>Process Payment</Text>
            <Text style={styles.bsSub}>
              Verify account details before processing payment.
            </Text>

            {/* Fee input */}
            {feeEnabled && (
              <>
                <Text style={styles.bsLabel}>Platform Fee (₦)</Text>
                <TextInput
                  style={styles.bsInput}
                  value={manualFee}
                  onChangeText={setManualFee}
                  keyboardType="numeric"
                  placeholder="e.g. 200"
                  placeholderTextColor="#BBB"
                />
              </>
            )}

            <Text style={styles.bsLabel}>Account Number</Text>
            <TextInput
              style={styles.bsInput}
              value={manualAccountNo}
              onChangeText={(v) => {
                setManualAccountNo(v);
                // Clear verified name if account number changes
                if (verifiedAccountName) setVerifiedAccountName(null);
              }}
              keyboardType="numeric"
              placeholder="0000000000"
              placeholderTextColor="#BBB"
              maxLength={10}
            />

            <Text style={styles.bsLabel}>Bank</Text>
            <TouchableOpacity
              style={styles.bsBankPicker}
              onPress={() => setShowBankPickerModal(true)}>
              <Text style={[styles.bsBankPickerText, !selectedVerifyBank && { color: "#BBB" }]}>
                {selectedVerifyBank ? selectedVerifyBank.name : "Select bank"}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color="#AAA" />
            </TouchableOpacity>

            {verifiedAccountName && (
              <View style={styles.verifiedNameBox}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#2E7D32" />
                <Text style={styles.verifiedNameText}>{verifiedAccountName}</Text>
              </View>
            )}

            <View style={styles.bsActions}>
              <TouchableRipple
                style={styles.bsCancel}
                onPress={resetVerifyModal}>
                <Text style={styles.bsCancelText}>Cancel</Text>
              </TouchableRipple>

              {/* Step 1: Verify Account (only if not yet verified) */}
              {!verifiedAccountName ? (
                <TouchableRipple
                  style={[
                    styles.bsConfirm,
                    (isVerifying || manualAccountNo.length < 10 || !selectedVerifyBank) && styles.btnDisabled,
                  ]}
                  disabled={isVerifying || manualAccountNo.length < 10 || !selectedVerifyBank}
                  onPress={async () => {
                    try {
                      // verify_only=true — does NOT trigger payment processing
                      const result = await verifyOrderDetails({
                        orderId,
                        account_number: manualAccountNo,
                        bank_code: selectedVerifyBank!.code,
                        bank_name: selectedVerifyBank!.name,
                        platform_fee: manualFee || "0",
                        verify_only: true,
                      }).unwrap();
                      setVerifiedAccountName(result.account_name);
                      showToast({ message: "Account verified!", duration: 2000 });
                    } catch (err: any) {
                      showToast({ message: err?.data?.message ?? "Verification failed.", duration: 3000 });
                    }
                  }}>
                  <View style={styles.btnInner}>
                    {isVerifying
                      ? <ActivityIndicator size={16} color="#fff" />
                      : <Text style={styles.bsConfirmText}>Verify Account</Text>}
                  </View>
                </TouchableRipple>

              ) : (
                /* Step 2: Save & Process (triggers payment) */
                <TouchableRipple
                  style={styles.bsConfirm}
                  onPress={async () => {
                    try {
                      // verify_only=false (default) — triggers payment processing
                      await verifyOrderDetails({
                        orderId,
                        account_number: manualAccountNo,
                        bank_code: selectedVerifyBank!.code,
                        bank_name: selectedVerifyBank!.name,
                        platform_fee: manualFee || "0",
                        verify_only: false,
                      }).unwrap();
                    } catch (err: any) {
                      // Non-fatal — payment may still process in background
                      console.warn("Save & process error (non-fatal):", err?.data?.message);
                    }

                    // Always close cleanly and refresh — never crash
                    resetVerifyModal();
                    showToast({
                      message: feeEnabled
                        ? "Details saved. Processing payment now..."
                        : "Details saved. Payment will process on next cycle.",
                      duration: 3000,
                    });
                    // Stable refresh — single call after short delay
                    setTimeout(() => navigation.goBack(), 500);
                  }}>
                  <Text style={styles.bsConfirmText}>Save & Process</Text>
                </TouchableRipple>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Bank Picker Modal ── */}
      <Modal visible={showBankPickerModal} transparent animationType="slide">
        <View style={styles.bsOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowBankPickerModal(false)} />
          <View style={[styles.bsCard, { maxHeight: "75%" }]}>
            <View style={styles.bsHandle} />
            <Text style={styles.bsTitle}>Select Bank</Text>
            <View style={styles.bsSearchRow}>
              <MaterialCommunityIcons name="magnify" size={16} color="#AAA" />
              <TextInput
                style={styles.bsSearchInput}
                value={bankSearch}
                onChangeText={setBankSearch}
                placeholder="Search bank..."
                placeholderTextColor="#BBB"
              />
            </View>
            <FlatList
              data={filteredBanks}
              keyExtractor={item => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableRipple
                  style={[styles.bsBankItem, selectedVerifyBank?.code === item.code && styles.bsBankItemActive]}
                  onPress={() => {
                    setSelectedVerifyBank(item);
                    setBankSearch("");
                    setShowBankPickerModal(false);
                  }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[styles.bsBankItemText, selectedVerifyBank?.code === item.code && { color: BRAND, fontWeight: "700" }]}>
                      {item.name}
                    </Text>
                    {selectedVerifyBank?.code === item.code && (
                      <MaterialCommunityIcons name="check" size={16} color={BRAND} />
                    )}
                  </View>
                </TouchableRipple>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ── Release Confirmation Modal ── */}
      <Modal visible={showReleaseModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#F5A623" />
            </View>
            <Text style={styles.modalTitle}>Release Coin?</Text>
            <Text style={styles.modalBody}>
              You are about to release{" "}
              <Text style={{ fontWeight: "800", color: "#111" }}>
                {order?.quantity} {order?.coin}
              </Text>{" "}
              to the buyer. This action cannot be undone.{"\n\n"}
              Only confirm if you have received the payment in full.
            </Text>
            <View style={styles.modalActions}>
              <TouchableRipple
                style={styles.modalCancel}
                onPress={() => setShowReleaseModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.modalConfirm}
                onPress={handleReleaseConfirmed}>
                <Text style={styles.modalConfirmText}>Yes, Release</Text>
              </TouchableRipple>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, myBybitUid }: {
  message: P2PMessage;
  myBybitUid: string | null;
}) {
  const isSystem = message.role !== "user";
  const isMine   = !isSystem && myBybitUid !== null && message.user_id === myBybitUid;

  if (isSystem) {
    return (
      <View style={styles.systemMsgWrap}>
        <View style={styles.systemMsgBubble}>
          <MaterialCommunityIcons name="information-outline" size={12} color="#888" />
          <Text style={styles.systemMsgText}>{message.message ?? ""}</Text>
        </View>
        <Text style={styles.systemMsgTime}>
          {message.created_at
            ? new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : ""}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <TouchableOpacity
          onLongPress={() => { Clipboard.setString(message.message ?? ""); }}
          activeOpacity={0.8}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {message.message ?? ""}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.bubbleTime, isMine && { color: "rgba(255,255,255,0.7)" }]}>
          {message.created_at
            ? new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#EFEFEF",
  },
  backBtn: { padding: 4, borderRadius: 20 },
  chatToggleBtn: { padding: 4, borderRadius: 20 },
  headerText: { fontSize: 16, fontWeight: "800", color: "#111" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#888" },
  errorText: { fontSize: 15, color: "#E53935", fontWeight: "600" },
  retryBtn: { backgroundColor: BRAND, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
  retryText: { color: "#fff", fontWeight: "700" },
  scroll: { padding: 16, gap: 12 },
  summaryCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E8EEF9" },
  coinRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  coinCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#26A17B", justifyContent: "center", alignItems: "center" },
  coinCircleText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  summaryTitle: { fontSize: 14, color: "#555", marginBottom: 2 },
  summaryAmount: { fontSize: 16, fontWeight: "800", color: "#111" },
  summaryDate: { fontSize: 12, color: "#AAA" },
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#888", paddingLeft: 4 },
  sectionCard: { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: "#E8EEF9" },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  paymentIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND_LIGHT, justifyContent: "center", alignItems: "center" },
  paymentMethodName: { fontSize: 15, fontWeight: "700", color: "#111" },
  paymentAccountNo: { fontSize: 13, color: "#888" },
  divider: { height: 1, backgroundColor: "#F0F4FB" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13 },
  infoLabel: { fontSize: 13, color: "#888" },
  infoValue: { fontSize: 13, color: "#222", fontWeight: "500" },
  infoValueBold: { fontSize: 15, color: "#111", fontWeight: "800" },
  monoText: { fontVariant: ["tabular-nums"], fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  exchangeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  exchangeDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#0A0F1E", justifyContent: "center", alignItems: "center" },
  exchangeDotText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  releaseTimeLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  progressCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E8EEF9", gap: 10 },
  progressTrack: { height: 8, backgroundColor: "#E8EEF9", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: BRAND, borderRadius: 4 },
  progressLabel: { fontSize: 13, color: "#555", textAlign: "center", lineHeight: 19 },
  chatHint: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#D0D9EE" },
  chatHintInner: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  chatHintText: { flex: 1, fontSize: 14, fontWeight: "600", color: BRAND },

  // Chat
  chatContainer: { flex: 1 },
  messagesList: { padding: 16, gap: 8, flexGrow: 1 },
  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
  emptyChatText: { fontSize: 14, color: "#AAA" },
  refreshBtn: { paddingVertical: 8, alignItems: "center" },
  refreshBtnInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  refreshBtnText: { fontSize: 12, color: BRAND, fontWeight: "600" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#EFEFEF", gap: 10 },
  messageInput: { flex: 1, borderWidth: 1.5, borderColor: "#E8EEF9", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#111", maxHeight: 100, backgroundColor: "#FAFCFF" },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BRAND, justifyContent: "center", alignItems: "center" },
  sendBtnDisabled: { opacity: 0.4 },

  // Bubbles
  bubbleWrap: { marginBottom: 4 },
  bubbleWrapRight: { alignItems: "flex-end" },
  bubbleWrapLeft: { alignItems: "flex-start" },
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, gap: 2 },
  bubbleMine: { backgroundColor: BRAND, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E8EEF9", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: "#fff" },
  bubbleTextTheirs: { color: "#222" },
  bubbleTime: { fontSize: 10, color: "#888", alignSelf: "flex-end" },
  systemMsgWrap: { alignItems: "center", marginVertical: 6 },
  systemMsgBubble: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F0F4FB", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    maxWidth: "85%",
  },
  systemMsgText: { fontSize: 12, color: "#666", textAlign: "center", lineHeight: 17, flex: 1 },
  systemMsgTime: { fontSize: 10, color: "#BBB", marginTop: 2 },

  // Bottom actions
  bottomActions: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#EFEFEF" },
  actionRow: { flexDirection: "row", gap: 10, alignItems: "center" },

  // Mark as Paid + Process group
  markPaidGroup: { flex: 1, flexDirection: "row", gap: 8, alignItems: "center" },
  primaryBtn: { flex: 1, backgroundColor: BRAND, borderRadius: 30, paddingVertical: 14, alignItems: "center" },
  // Process button — compact, outlined
  processBtn: {
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5, borderColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  processBtnText: { fontSize: 13, fontWeight: "700", color: BRAND },

  releaseBtn: { flex: 1, backgroundColor: "#2E7D32", borderRadius: 30, paddingVertical: 14, alignItems: "center" },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  primaryBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  releaseBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  btnDisabled: { opacity: 0.5 },
  disputeBtn: { flex: 1, borderWidth: 1.5, borderColor: "#D0D9EE", borderRadius: 30, paddingVertical: 14, alignItems: "center" },
  disputeBtnSmall: { flex: 0, paddingHorizontal: 20 },
  disputeText: { fontSize: 14, fontWeight: "700", color: "#333" },

  // Release modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", gap: 12, width: "100%" },
  modalIconWrap: { marginBottom: 4 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#111" },
  modalBody: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 21 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8, width: "100%" },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 30, borderWidth: 1.5, borderColor: "#D0D9EE", alignItems: "center" },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: "#555" },
  modalConfirm: { flex: 1, paddingVertical: 14, borderRadius: 30, backgroundColor: "#2E7D32", alignItems: "center" },
  modalConfirmText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  verifyBanner:      { backgroundColor: "#FFF8E7", borderRadius: 10, borderWidth: 1, borderColor: "#FFE082", marginTop: 8 },
  verifyBannerInner: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8 },
  verifyBannerText:  { flex: 1, fontSize: 13, color: "#F5A623", fontWeight: "600" },
  modalLabel:        { fontSize: 13, fontWeight: "700", color: "#555", marginBottom: 4 },
  modalInput:        { borderWidth: 1.5, borderColor: "#E8EEF9", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111", marginBottom: 12 },
  verifiedNameBox:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#E8F5E9", borderRadius: 10, padding: 12, marginBottom: 8 },
  verifiedNameText:  { fontSize: 14, fontWeight: "700", color: "#2E7D32" },
  bsOverlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  bsCard:           { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, gap: 10 },
  bsHandle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 8 },
  bsTitle:          { fontSize: 18, fontWeight: "800", color: "#111" },
  bsSub:            { fontSize: 13, color: "#888", lineHeight: 19 },
  bsLabel:          { fontSize: 13, fontWeight: "700", color: "#555" },
  bsInput:          { borderWidth: 1.5, borderColor: "#E8EEF9", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111" },
  bsBankPicker:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1.5, borderColor: "#E8EEF9", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  bsBankPickerText: { fontSize: 14, color: "#111" },
  bsActions:        { flexDirection: "row", gap: 12, marginTop: 4 },
  bsCancel:         { flex: 1, paddingVertical: 14, borderRadius: 30, borderWidth: 1.5, borderColor: "#D0D9EE", alignItems: "center" },
  bsCancelText:     { fontSize: 15, fontWeight: "700", color: "#555" },
  bsConfirm:        { flex: 1.5, paddingVertical: 14, borderRadius: 30, backgroundColor: "#2E7D32", alignItems: "center" },
  bsConfirmText:    { fontSize: 15, fontWeight: "700", color: "#fff" },
  bsSearchRow:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F4F6FB", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  bsSearchInput:    { flex: 1, fontSize: 14, color: "#111" },
  bsBankItem:       { paddingVertical: 13, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#F0F4FB" },
  bsBankItemActive: { backgroundColor: BRAND_LIGHT, borderRadius: 8, paddingHorizontal: 8 },
  bsBankItemText:   { fontSize: 14, color: "#222" },
  // Add these alongside the other chat styles:
chatUtilityRow: { 
  flexDirection: "row", 
  justifyContent: "space-between", 
  alignItems: "center",
  paddingHorizontal: 8,
  borderBottomWidth: 1, 
  borderBottomColor: "#F0F4FB" 
},
chatProcessBtn: { 
  paddingVertical: 8, 
  paddingHorizontal: 12, 
  alignItems: "center" 
},
});
