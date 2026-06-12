import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Platform,
  KeyboardAvoidingView, StatusBar,
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

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

export default function DepositCryptoScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user   = useSelector(selectUser);

  // ── All original state — untouched ────────────────────────────────────────
  const [cryptoAssets, setCryptoAssets]           = useState<UserCryptoAsset[]>(user?.crypto_assets ?? []);
  const [networks, setNetworks]                   = useState<UserNetwork[]>([]);
  const [selectedSymbol, setSelectedSymbol]       = useState("USDT");
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [walletAddress, setWalletAddress]         = useState("");
  const [txHash, setTxHash]                       = useState("");
  const [amount, setAmount]                       = useState("");
  const [showAssetPicker, setShowAssetPicker]     = useState(false);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [dynamicDepositNetworks, setDynamicDepositNetworks] = useState<Record<string, Record<string, boolean>>>({});
  const [minimumDeposit, setMinimumDeposit]       = useState<Record<string, Record<string, number>>>({});

  const [submitDeposit, { isLoading }] = useSubmitCryptoDepositMutation();
  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  // ── All original derived values — untouched ───────────────────────────────
  const selectedAsset    = cryptoAssets.find(a => a.symbol === selectedSymbol);
  const selectedNetwork  = networks.find(n => n.id === selectedNetworkId);
  const networkKey       = selectedNetwork?.name?.toUpperCase() ?? "";
  const isDynamicNetwork = selectedSymbol && networkKey
    ? !!dynamicDepositNetworks[selectedSymbol]?.[networkKey] : false;
  const canShowTxHash = !!selectedSymbol && !!selectedNetworkId && !!walletAddress && !isDynamicNetwork;
  const balance = parseFloat((user?.wallet_balances as any)?.[selectedSymbol?.toLowerCase()]?.balance ?? "0");

  // ── All original effects + handlers — untouched ───────────────────────────
  useEffect(() => {
    API.defaults.baseURL = BASE_URL;
    API.get("/api/v1/app-config").then(res => {
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
    }).catch(() => {});
  }, []);

  useEffect(() => { setCryptoAssets(user?.crypto_assets ?? []); }, [user?.crypto_assets]);

  useEffect(() => {
    const asset = cryptoAssets.find(a => a.symbol === selectedSymbol);
    if (asset) {
      setNetworks(asset.networks); setSelectedNetworkId(null);
      setWalletAddress(""); setShowNetworkPicker(false);
    } else { setNetworks([]); }
  }, [selectedSymbol]);

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
      }).then(res => setWalletAddress(res.data.address)).catch(() => setWalletAddress(""));
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
      showToast({ message: "Please enter your transaction hash.", variant: "warning" }); return;
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
      showToast({ message: err?.data?.message || err?.data?.error || "Something went wrong.", variant: "error" });
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── iOS nav bar ── */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={s.navCenter}>
          <Text style={s.navTitle}>Deposit Crypto</Text>
          <Text style={s.navSub}>Receive into your BinaPay wallet</Text>
        </View>
        <TouchableOpacity style={s.helpBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="help-circle-outline" size={22} color={BRAND} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Asset selector ── */}
          <Text style={s.sectionHeader}>Asset</Text>
          <TouchableOpacity style={[s.selectorCard, IOS_SHADOW]} onPress={() => setShowAssetPicker(v => !v)} activeOpacity={0.8}>
            {selectedAsset?.icon_url ? (
              <Image source={{ uri: selectedAsset.icon_url }} style={s.assetIcon} />
            ) : (
              <View style={[s.assetIcon, s.assetIconFallback]}>
                {selectedAsset
                  ? <Text style={s.assetIconText}>{selectedSymbol.slice(0, 2).toUpperCase()}</Text>
                  : <MaterialCommunityIcons name="currency-btc" size={20} color={PLACEHOLDER} />}
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.selectorName}>{selectedAsset ? selectedSymbol.toUpperCase() : "Select Asset"}</Text>
              {selectedAsset && <Text style={s.selectorSub}>{selectedAsset.name}</Text>}
            </View>
            <MaterialCommunityIcons name={showAssetPicker ? "chevron-up" : "chevron-down"} size={18} color={PLACEHOLDER} />
          </TouchableOpacity>

          {showAssetPicker && (
            <View style={[s.dropdownCard, IOS_SHADOW]}>
              {cryptoAssets.map((asset, i) => (
                <TouchableOpacity
                  key={asset.id}
                  style={[s.dropdownItem, i < cryptoAssets.length - 1 && s.dropdownItemBorder]}
                  onPress={() => { setSelectedSymbol(asset.deposit_enabled ? asset.symbol : ""); setShowAssetPicker(false); }}
                  disabled={!asset.deposit_enabled}
                  activeOpacity={0.7}>
                  {asset.icon_url ? (
                    <Image source={{ uri: asset.icon_url }} style={s.assetIcon} />
                  ) : (
                    <View style={[s.assetIcon, s.assetIconFallback]}>
                      <Text style={s.assetIconText}>{asset.symbol.slice(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.dropdownName, !asset.deposit_enabled && { color: PLACEHOLDER }]}>
                      {asset.symbol.toUpperCase()}{!asset.deposit_enabled ? "  (Disabled)" : ""}
                    </Text>
                    <Text style={s.dropdownSub}>{asset.name}</Text>
                  </View>
                  {selectedSymbol === asset.symbol && <MaterialCommunityIcons name="check-circle" size={18} color={BLUE} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Network selector ── */}
          {networks.length > 0 && (
            <>
              <Text style={s.sectionHeader}>Network</Text>
              <TouchableOpacity
                style={[s.networkCard, selectedNetworkId !== null && s.networkCardActive, IOS_SHADOW]}
                onPress={() => setShowNetworkPicker(v => !v)} activeOpacity={0.8}>
                <View style={[s.networkIconWrap, { backgroundColor: selectedNetworkId !== null ? BLUE_LIGHT : BG }]}>
                  <MaterialCommunityIcons name="swap-horizontal" size={18} color={selectedNetworkId !== null ? BLUE : PLACEHOLDER} />
                </View>
                <View style={{ flex: 1 }}>
                  {selectedNetwork ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[s.networkName, { color: BRAND }]}>{selectedNetwork.name}</Text>
                      {!!dynamicDepositNetworks[selectedSymbol]?.[selectedNetwork.name.toUpperCase()] && (
                        <View style={s.recommendedBadge}>
                          <Text style={s.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={s.networkNamePlaceholder}>Select network</Text>
                  )}
                </View>
                <MaterialCommunityIcons name={showNetworkPicker ? "chevron-up" : "chevron-down"} size={18} color={PLACEHOLDER} />
              </TouchableOpacity>

              {showNetworkPicker && (
                <View style={[s.dropdownCard, IOS_SHADOW]}>
                  {networks.map((network, i) => {
                    const netKey    = network.name.toUpperCase();
                    const isDynamic = !!dynamicDepositNetworks[selectedSymbol]?.[netKey];
                    return (
                      <TouchableOpacity
                        key={network.id}
                        style={[s.dropdownItem, i < networks.length - 1 && s.dropdownItemBorder]}
                        onPress={() => { setSelectedNetworkId(network.id); setShowNetworkPicker(false); }}
                        activeOpacity={0.7}>
                        <View style={[s.networkIconWrap, { backgroundColor: BG }]}>
                          <MaterialCommunityIcons name="swap-horizontal" size={16} color={SUBLABEL} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={s.dropdownName}>{network.name}</Text>
                            {isDynamic && (
                              <View style={s.recommendedBadge}>
                                <Text style={s.recommendedText}>Recommended</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {selectedNetworkId === network.id && <MaterialCommunityIcons name="check-circle" size={18} color={BLUE} />}
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
              <Text style={s.sectionHeader}>Deposit Address</Text>
              <View style={[s.addressCard, IOS_SHADOW]}>
                <View style={s.addressHeader}>
                  <MaterialCommunityIcons name="shield-check-outline" size={14} color={BLUE} />
                  <Text style={s.addressHeaderText}>Verified deposit address</Text>
                </View>
                <View style={s.addressBox}>
                  <Text style={s.addressText} selectable numberOfLines={2}>{walletAddress}</Text>
                  <TouchableOpacity onPress={copyAddress} style={s.copyIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="content-copy" size={20} color={BLUE} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* QR Code */}
              <View style={[s.qrSection, IOS_SHADOW]}>
                <QRCode value={walletAddress} size={140} backgroundColor="white" />
                <Text style={s.qrCaption}>Send only {selectedSymbol.toUpperCase()} · {selectedNetwork?.name ?? ""} network</Text>
              </View>

              {/* ── Transaction Hash (manual only) ── */}
              {canShowTxHash && (
                <>
                  <Text style={s.sectionHeader}>Transaction Hash (TxID)</Text>
                  <Text style={s.txHashSub}>After sending, paste your transaction hash below.</Text>
                  <View style={[s.inputCard, IOS_SHADOW]}>
                    <TextInput
                      style={s.txInput}
                      placeholder="Paste transaction hash here"
                      placeholderTextColor={PLACEHOLDER}
                      value={txHash}
                      onChangeText={t => setTxHash(t.replace(/\s+/g, ""))}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <MaterialCommunityIcons name="line-scan" size={18} color={PLACEHOLDER} />
                  </View>
                  <Text style={s.explorerHint}>Find your transaction hash on the blockchain explorer.</Text>
                </>
              )}

              {/* Minimum deposit */}
              {minimumDeposit[selectedSymbol]?.[networkKey] != null && (
                <View style={[s.minDepositCard, IOS_SHADOW]}>
                  <View style={s.minDepositIconWrap}>
                    <MaterialCommunityIcons name="currency-usd" size={16} color="#16A34A" />
                  </View>
                  <View>
                    <Text style={s.minDepositLabel}>Minimum Deposit</Text>
                    <Text style={s.minDepositValue}>
                      {minimumDeposit[selectedSymbol][networkKey]} {selectedSymbol.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Instructions */}
              <View style={[s.instructionsCard, IOS_SHADOW]}>
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

      {/* ── Footer (manual only) ── */}
      {canShowTxHash && walletAddress ? (
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }, IOS_SHEET_SHADOW]}>
          <View style={s.secureRow}>
            <MaterialCommunityIcons name="lock-outline" size={12} color={PLACEHOLDER} />
            <Text style={s.secureNote}>Your information is secure and encrypted</Text>
          </View>
          <TouchableOpacity
            style={[s.confirmBtn, isLoading && s.disabledBtn]}
            onPress={handleConfirmDeposit}
            disabled={isLoading}
            activeOpacity={0.85}>
            <Text style={s.confirmBtnText}>{isLoading ? "Submitting…" : "I've Sent the Funds"}</Text>
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
  root:              { flex: 1, backgroundColor: BG },
  navBar:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:         { flex: 1, alignItems: "center" },
  navTitle:          { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:            { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  helpBtn:           { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  scroll:            { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 },
  sectionHeader:     { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, marginTop: 14, marginLeft: 4 },
  selectorCard:      { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  assetIcon:         { width: 40, height: 40, borderRadius: 20 },
  assetIconFallback: { backgroundColor: SEPARATOR, justifyContent: "center", alignItems: "center" },
  assetIconText:     { fontSize: 12, fontWeight: "700", color: SUBLABEL },
  selectorName:      { fontSize: 15, fontWeight: "600", color: LABEL },
  selectorSub:       { fontSize: 12, color: SUBLABEL, marginTop: 2 },
  dropdownCard:      { backgroundColor: SURFACE, borderRadius: 14, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 6 },
  dropdownItem:      { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13, minHeight: 56 },
  dropdownItemBorder:{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  dropdownName:      { fontSize: 14, fontWeight: "600", color: LABEL },
  dropdownSub:       { fontSize: 12, color: SUBLABEL, marginTop: 2 },
  networkCard:       { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: "transparent", marginBottom: 6 },
  networkCardActive: { borderColor: BLUE, backgroundColor: "#F0F7FF" },
  networkIconWrap:   { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  networkName:       { fontSize: 14, fontWeight: "600", color: LABEL },
  networkNamePlaceholder: { fontSize: 14, color: PLACEHOLDER },
  recommendedBadge:  { backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  recommendedText:   { fontSize: 11, fontWeight: "600", color: "#16A34A" },
  addressCard:       { backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 8 },
  addressHeader:     { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  addressHeaderText: { fontSize: 12, fontWeight: "600", color: SUBLABEL },
  addressBox:        { flexDirection: "row", alignItems: "center", backgroundColor: BG, borderRadius: 10, padding: 12 },
  addressText:       { flex: 1, fontSize: 13, color: LABEL, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  copyIconBtn:       { padding: 4, marginLeft: 8 },
  qrSection:         { backgroundColor: SURFACE, borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  qrCaption:         { fontSize: 12, color: SUBLABEL, marginTop: 10, textAlign: "center" },
  txHashSub:         { fontSize: 12, color: SUBLABEL, marginBottom: 8, marginTop: -6, marginLeft: 4 },
  inputCard:         { backgroundColor: SURFACE, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, marginBottom: 6 },
  txInput:           { flex: 1, fontSize: 14, color: LABEL, paddingVertical: 14 },
  explorerHint:      { fontSize: 12, color: BLUE, marginBottom: 8, marginLeft: 4 },
  minDepositCard:    { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F0FDF4", borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BBF7D0" },
  minDepositIconWrap:{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#DCFCE7", justifyContent: "center", alignItems: "center" },
  minDepositLabel:   { fontSize: 12, color: "#16A34A" },
  minDepositValue:   { fontSize: 16, fontWeight: "700", color: "#15803D", marginTop: 2 },
  instructionsCard:  { backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  instructionsHeader:{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  instructionsTitle: { fontSize: 14, fontWeight: "700", color: LABEL },
  instructionRow:    { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  bullet:            { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BLUE, marginTop: 6 },
  instructionText:   { flex: 1, fontSize: 13, color: SUBLABEL, lineHeight: 18 },
  footer:            { backgroundColor: SURFACE, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR },
  secureRow:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 8 },
  secureNote:        { fontSize: 11, color: PLACEHOLDER },
  confirmBtn:        { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  confirmBtnText:    { fontSize: 16, fontWeight: "700", color: SURFACE },
  disabledBtn:       { opacity: 0.5 },
});
