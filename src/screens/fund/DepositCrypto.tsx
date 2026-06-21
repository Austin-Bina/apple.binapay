import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Platform, KeyboardAvoidingView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { selectUser } from "@store/selectors/auth";
import { formattedBalance } from "@utils/transactionutils";
import { showToast } from "@helpers/toast";
import API from "@lib/api";
import QRCode from "react-native-qrcode-svg";
import TransactionSuccessModal from "@components/ui/modals/TransactionSuccessModal";
import { CryptoAsset as UserCryptoAsset, Network as UserNetwork } from "@type/user";
import { useSubmitCryptoDepositMutation } from "@store/redux-api/fundsApi";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

export default function DepositCryptoScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user   = useSelector(selectUser);

  const [cryptoAssets, setCryptoAssets]         = useState<UserCryptoAsset[]>(user?.crypto_assets ?? []);
  const [networks, setNetworks]                 = useState<UserNetwork[]>([]);
  const [selectedSymbol, setSelectedSymbol]     = useState("USDT");
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [walletAddress, setWalletAddress]       = useState("");
  const [txHash, setTxHash]                     = useState("");
  const [amount, setAmount]                     = useState("");
  const [showAssetPicker, setShowAssetPicker]   = useState(false);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [dynamicDepositNetworks, setDynamicDepositNetworks] = useState<Record<string, Record<string, boolean>>>({});
  const [minimumDeposit, setMinimumDeposit]     = useState<Record<string, Record<string, number>>>({});

  const [submitDeposit, { isLoading }] = useSubmitCryptoDepositMutation();
  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  const selectedAsset    = cryptoAssets.find(a => a.symbol === selectedSymbol);
  const selectedNetwork  = networks.find(n => n.id === selectedNetworkId);
  const networkKey       = selectedNetwork?.name?.toUpperCase() ?? "";
  const isDynamicNetwork = selectedSymbol && networkKey
    ? !!dynamicDepositNetworks[selectedSymbol]?.[networkKey]
    : false;
  const canShowTxHash = !!selectedSymbol && !!selectedNetworkId && !!walletAddress && !isDynamicNetwork;
  const balance = parseFloat(
    (user?.wallet_balances as any)?.[selectedSymbol?.toLowerCase()]?.balance ?? "0"
  );

  // ── Fetch app config ──────────────────────────────────────────────────────
  useEffect(() => {
    API.defaults.baseURL = BASE_URL;
    API.get("/api/v1/app-config")
      .then(res => {
        const normalized: Record<string, Record<string, boolean>> = {};
        const minDep: Record<string, Record<string, number>>      = {};
        Object.keys(res.data.dynamic_deposit_networks ?? {}).forEach(asset => {
          normalized[asset] = {};
          Object.keys(res.data.dynamic_deposit_networks[asset]).forEach(net => {
            normalized[asset][net.toUpperCase()] = res.data.dynamic_deposit_networks[asset][net];
          });
        });
        Object.keys(res.data.minimum_deposit ?? {}).forEach(asset => {
          minDep[asset] = {};
          Object.keys(res.data.minimum_deposit[asset]).forEach(net => {
            minDep[asset][net.toUpperCase()] = res.data.minimum_deposit[asset][net];
          });
        });
        setDynamicDepositNetworks(normalized);
        setMinimumDeposit(minDep);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCryptoAssets(user?.crypto_assets ?? []);
  }, [user?.crypto_assets]);

  // ── Networks when asset changes ───────────────────────────────────────────
  useEffect(() => {
    const asset = cryptoAssets.find(a => a.symbol === selectedSymbol);
    if (asset) {
      setNetworks(asset.networks);
      setSelectedNetworkId(null);
      setWalletAddress("");
      setShowNetworkPicker(false);
    } else {
      setNetworks([]);
    }
  }, [selectedSymbol]);

  // ── Wallet address when network changes ───────────────────────────────────
  useEffect(() => {
    if (!selectedAsset || !selectedNetwork) { setWalletAddress(""); return; }
    if (isDynamicNetwork) {
      API.defaults.baseURL = BASE_URL;
      API.post("/api/v1/crypto-deposit-address", {
        currency:          selectedAsset.symbol,
        crypto_network_id: selectedNetwork.id,
        network:
          selectedNetwork.nowpayments_network_slug ??
          selectedNetwork.network_slug ??
          selectedNetwork.name.toLowerCase(),
      })
        .then(res => setWalletAddress(res.data.address))
        .catch(() => setWalletAddress(""));
      return;
    }
    setWalletAddress(selectedNetwork.deposit_address);
  }, [selectedSymbol, selectedNetworkId, networks]);

  const copyAddress = async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    showToast({ message: "Wallet address copied!", variant: "success" });
  };

  const handleConfirmDeposit = async () => {
    if (!selectedSymbol || !selectedNetworkId || !walletAddress) return;
    if (!isDynamicNetwork && !txHash.trim()) {
      showToast({ message: "Please enter your transaction hash.", variant: "warning" });
      return;
    }
    try {
      await submitDeposit({
        crypto_asset_id:   selectedAsset!.id,
        crypto_network_id: String(selectedNetworkId),
        tx_hash:           txHash,
        amount:            amount ? parseFloat(amount) : null,
      }).unwrap();
      setSuccessModalVisible(true);
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error || "Something went wrong. Please try again.";
      showToast({ message: msg, variant: "error" });
    }
  };

  return (
    <View style={[s.root]}>

      {/* ── Header ── */}
        <ScreenHeader
        title="Deposit Crypto"
        subtitle="Receive cryptocurrency into your BinaPay wallet"
        onBack={() => navigation.goBack()}
        rightIcon="help-circle-outline"
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Step 1: Select Asset ── */}
          <Text style={s.stepLabel}>1. Select Asset</Text>

          <TouchableOpacity
            style={s.selectorCard}
            onPress={() => setShowAssetPicker(v => !v)}
            activeOpacity={0.8}
          >
            {selectedAsset?.icon_url ? (
              <Image source={{ uri: selectedAsset.icon_url }} style={s.assetIcon} />
            ) : (
              <View style={[s.assetIcon, { backgroundColor: selectedAsset ? "#e5e7eb" : "#f3f4f6", justifyContent: "center", alignItems: "center" }]}>
                {selectedAsset
                  ? <Text style={s.assetIconText}>{selectedSymbol.slice(0, 2).toUpperCase()}</Text>
                  : <MaterialCommunityIcons name="currency-btc" size={20} color="#9ca3af" />
                }
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.selectorName}>
                {selectedAsset ? selectedSymbol.toUpperCase() : "Select Asset"}
              </Text>
              {selectedAsset && <Text style={s.selectorSub}>{selectedAsset.name}</Text>}
            </View>
            <MaterialCommunityIcons name={showAssetPicker ? "chevron-up" : "chevron-down"} size={18} color="#9ca3af" />
          </TouchableOpacity>

          {/* Asset dropdown */}
          {showAssetPicker && (
            <View style={s.dropdown}>
              {cryptoAssets.map(asset => (
                <TouchableOpacity
                  key={asset.id}
                  style={s.dropdownItem}
                  onPress={() => { setSelectedSymbol(asset.deposit_enabled ? asset.symbol : ""); setShowAssetPicker(false); }}
                  disabled={!asset.deposit_enabled}
                >
                  {asset.icon_url ? (
                    <Image source={{ uri: asset.icon_url }} style={s.assetIcon} />
                  ) : (
                    <View style={[s.assetIcon, { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" }]}>
                      <Text style={s.assetIconText}>{asset.symbol.slice(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.dropdownName, !asset.deposit_enabled && { color: "#9ca3af" }]}>
                      {asset.symbol.toUpperCase()}{!asset.deposit_enabled ? "  (Disabled)" : ""}
                    </Text>
                    <Text style={s.dropdownSub}>{asset.name}</Text>
                  </View>
                  {selectedSymbol === asset.symbol && (
                    <MaterialCommunityIcons name="check-circle" size={16} color={BLUE} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Step 2: Select Network ── */}
          {networks.length > 0 && (
            <>
              <Text style={[s.stepLabel, { marginTop: 12 }]}>2. Select Network</Text>

              <TouchableOpacity
                style={[s.networkCard, selectedNetworkId !== null && s.networkCardActive]}
                onPress={() => setShowNetworkPicker(v => !v)}
                activeOpacity={0.8}
              >
                <View style={[s.networkIconWrap, { backgroundColor: selectedNetworkId !== null ? "#EEF3FF" : "#f3f4f6" }]}>
                  <MaterialCommunityIcons name="swap-horizontal" size={18} color={selectedNetworkId !== null ? BLUE : "#9ca3af"} />
                </View>
                <View style={{ flex: 1 }}>
                  {selectedNetwork ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[s.networkName, { color: BRAND }]}>{selectedNetwork.name}</Text>
                      {!!dynamicDepositNetworks[selectedSymbol]?.[selectedNetwork.name.toUpperCase()] && (
                        <View style={s.recommendedBadge}>
                          <Text style={s.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={s.networkName}>Select network</Text>
                  )}
                </View>
                <MaterialCommunityIcons name={showNetworkPicker ? "chevron-up" : "chevron-down"} size={18} color="#9ca3af" />
              </TouchableOpacity>

              {showNetworkPicker && (
                <View style={s.dropdown}>
                  {networks.map(network => {
                    const netKey    = network.name.toUpperCase();
                    const isDynamic = !!dynamicDepositNetworks[selectedSymbol]?.[netKey];
                    return (
                      <TouchableOpacity
                        key={network.id}
                        style={s.dropdownItem}
                        onPress={() => { setSelectedNetworkId(network.id); setShowNetworkPicker(false); }}
                      >
                        <View style={[s.networkIconWrap, { backgroundColor: "#f3f4f6" }]}>
                          <MaterialCommunityIcons name="swap-horizontal" size={16} color="#9ca3af" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={s.dropdownName}>{network.name}</Text>
                            {isDynamic && (
                              <View style={s.recommendedBadge}>
                                <Text style={s.recommendedText}>Recommended</Text>
                              </View>
                            )}
                          </View>
            
                        </View>
                        {selectedNetworkId === network.id && (
                          <MaterialCommunityIcons name="check-circle" size={16} color={BLUE} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* ── Deposit Address ── */}
          {walletAddress ? (
            <>
              {/* Address card */}
              <View style={s.addressSection}>
                <View style={s.addressHeader}>
                  <MaterialCommunityIcons name="shield-check-outline" size={14} color={BLUE} />
                  <Text style={s.addressHeaderText}>Deposit Address</Text>
                </View>
                <View style={s.addressBox}>
                  <Text style={s.addressText} selectable numberOfLines={2}>{walletAddress}</Text>
                  <TouchableOpacity onPress={copyAddress} style={s.copyIconBtn}>
                    <MaterialCommunityIcons name="content-copy" size={18} color={BLUE} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* QR Code — compact, always fully visible */}
              <View style={s.qrSection}>
                <QRCode value={walletAddress} size={130} backgroundColor="white" />
                <Text style={s.qrCaption}>Send only {selectedSymbol.toUpperCase()} · {selectedNetwork?.name ?? ""} network</Text>
              </View>

            {/* ── Step 3: Transaction Hash (manual only) ── */}
          {canShowTxHash && (
            <>
              <Text style={[s.stepLabel, { marginTop: 12 }]}>3. Transaction Hash (TxID)</Text>
              <Text style={s.txHashSub}>After sending, paste your transaction hash below.</Text>
              <View style={s.inputCard}>
                <TextInput
                  style={s.txInput}
                  placeholder="Paste transaction hash here"
                  placeholderTextColor="#9ca3af"
                  value={txHash}
                  onChangeText={t => setTxHash(t.replace(/\s+/g, ""))}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <MaterialCommunityIcons name="line-scan" size={18} color="#9ca3af" />
              </View>
              <Text style={s.explorerHint}>
                Find your transaction hash on the blockchain explorer.
              </Text>
            </>
          )}
              {/* Minimum deposit */}
              {minimumDeposit[selectedSymbol]?.[networkKey] != null && (
                <View style={s.minDepositCard}>
                  <View style={s.minDepositIcon}>
                    <MaterialCommunityIcons name="currency-usd" size={16} color="#16a34a" />
                  </View>
                  <View>
                    <Text style={s.minDepositLabel}>Minimum Deposit</Text>
                    <Text style={s.minDepositValue}>
                      {minimumDeposit[selectedSymbol][networkKey]} {selectedSymbol.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Instructions — collapsed to essentials */}
              <View style={s.instructionsCard}>
                <View style={s.instructionsHeader}>
                  <MaterialCommunityIcons name="information-outline" size={15} color={BLUE} />
                  <Text style={s.instructionsTitle}>Deposit Instructions</Text>
                </View>
                {[
                  `Send only ${selectedSymbol.toUpperCase()} to this address.`,
                  `Ensure the network is ${selectedNetwork?.name ?? ""}.`,
                  isDynamicNetwork
                    ? "Deposits are credited automatically after confirmation."
                    : "Submit your transaction hash after sending.",
                  "Wrong network may result in permanent loss of funds.",
                ].map((line, i) => (
                  <View key={i} style={s.instructionRow}>
                    <View style={s.bullet} />
                    <Text style={s.instructionText}>{line}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

         

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Fixed bottom button (manual only) ── */}
      {canShowTxHash && walletAddress ? (
        <View style={[s.footer, { paddingBottom: insets.bottom + 10 }]}>
          <Text style={s.secureNote}>
            <MaterialCommunityIcons name="lock-outline" size={11} color="#9ca3af" />
            {"  "}Your information is secure and encrypted
          </Text>
          <TouchableOpacity
            style={[s.confirmBtn, isLoading && s.disabledBtn]}
            onPress={handleConfirmDeposit}
            disabled={isLoading}
          >
            <Text style={s.confirmBtnText}>
              {isLoading ? "Submitting..." : "I've Sent the Funds"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TransactionSuccessModal
        visible={successModalVisible}
        title="Deposit Submitted 🎉"
        message="Your deposit request has been submitted successfully. It will be credited shortly."
        onClose={() => setSuccessModalVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: "#f8f9fb" },

  // Header — tighter
  header:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:           { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginRight: 10 },
  helpBtn:           { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:       { fontSize: 15, fontWeight: "700", color: BRAND },
  headerSub:         { fontSize: 10, color: "#6b7280", marginTop: 1 },

  stepLabel:         { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },

  // Asset selector — less padding
  selectorCard:      { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#f0f0f0", marginBottom: 6 },
  assetIcon:         { width: 34, height: 34, borderRadius: 17 },
  assetIconText:     { fontSize: 11, fontWeight: "700", color: "#6b7280" },
  selectorName:      { fontSize: 14, fontWeight: "600", color: "#111827" },
  selectorSub:       { fontSize: 11, color: "#6b7280", marginTop: 1 },

  balancePill:       { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f3f4f6", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 4 },
  balancePillLabel:  { fontSize: 11, color: "#6b7280" },
  balancePillValue:  { fontSize: 11, fontWeight: "600", color: "#111827" },

  dropdown:          { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 6, overflow: "hidden" },
  dropdownItem:      { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  dropdownName:      { fontSize: 13, fontWeight: "600", color: "#111827" },
  dropdownSub:       { fontSize: 11, color: "#6b7280", marginTop: 1 },

  // Network card
  networkCard:       { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, padding: 10, borderWidth: 1.5, borderColor: "#f0f0f0", marginBottom: 6 },
  networkCardActive: { borderColor: BLUE, backgroundColor: "#f0f7ff" },
  networkIconWrap:   { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  networkName:       { fontSize: 13, fontWeight: "600", color: "#111827" },
  networkFee:        { fontSize: 11, color: "#6b7280", marginTop: 1 },
  recommendedBadge:  { backgroundColor: "#dcfce7", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  recommendedText:   { fontSize: 10, fontWeight: "600", color: "#16a34a" },

  autoCreditBanner:  { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 10, padding: 10, marginBottom: 8 },
  autoCreditTitle:   { fontSize: 12, fontWeight: "700", color: "#15803d", marginBottom: 1 },
  autoCreditSub:     { fontSize: 11, color: "#16a34a" },
  manualBanner:      { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 10, padding: 10, marginBottom: 8 },
  manualTitle:       { fontSize: 12, fontWeight: "700", color: "#d97706", marginBottom: 1 },
  manualSub:         { fontSize: 11, color: "#92400e" },

  // Address section
  addressSection:    { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", padding: 10, marginBottom: 8 },
  addressHeader:     { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  addressHeaderText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  addressBox:        { flexDirection: "row", alignItems: "center", backgroundColor: "#f8f9fb", borderRadius: 8, padding: 10, marginBottom: 8 },
  addressText:       { flex: 1, fontSize: 12, color: "#111827", fontFamily: "monospace" },
  copyIconBtn:       { padding: 4 },
  copyAddressBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingVertical: 8 },
  copyAddressBtnText:{ fontSize: 13, fontWeight: "600", color: BLUE },

  // QR — compact, no title needed (caption has the info)
  qrSection:         { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", padding: 12, alignItems: "center", marginBottom: 8 },
  qrCaption:         { fontSize: 11, color: "#6b7280", marginTop: 8, textAlign: "center" },

  minDepositCard:    { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: "#bbf7d0" },
  minDepositIcon:    { width: 32, height: 32, borderRadius: 16, backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center" },
  minDepositLabel:   { fontSize: 11, color: "#16a34a" },
  minDepositValue:   { fontSize: 15, fontWeight: "700", color: "#15803d", marginTop: 1 },

  instructionsCard:  { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", padding: 10, marginBottom: 8 },
  instructionsHeader:{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  instructionsTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  instructionRow:    { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 6 },
  bullet:            { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BLUE, marginTop: 5 },
  instructionText:   { flex: 1, fontSize: 12, color: "#374151", lineHeight: 17 },

  txHashSub:         { fontSize: 11, color: "#6b7280", marginBottom: 8, marginTop: -4 },
  inputCard:         { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 6 },
  txInput:           { flex: 1, fontSize: 13, color: "#111827", paddingVertical: 12 },
  explorerHint:      { fontSize: 11, color: "#2563EB", marginBottom: 6 },

  footer:            { backgroundColor: "#fff", paddingHorizontal: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  secureNote:        { fontSize: 10, color: "#9ca3af", textAlign: "center", marginBottom: 6 },
  confirmBtn:        { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  confirmBtnText:    { fontSize: 15, fontWeight: "700", color: "#fff" },
  disabledBtn:       { opacity: 0.5 },
});
