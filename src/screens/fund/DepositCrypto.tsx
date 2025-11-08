import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import tw from "@lib/tailwind";
import API from "@lib/api";
import { useNavigation } from "@react-navigation/native";
import { selectUser } from "@store/selectors/auth";
import { routes } from "@constants/routes";
import { Picker } from '@react-native-picker/picker';
import { useSelector } from "react-redux";
import { CryptoAsset as UserCryptoAsset, Network as UserNetwork } from "@type/user"; // adjust path
import TransactionSuccessModal from "@components/ui/modals/TransactionSuccessModal";

type Network = {
  id: number;
  name: string;
  deposit_address: string;
  qr_code: string | null;
};

type CryptoAsset = {
  id: number;
  name: string;
  symbol: string;
  networks: Network[];
  deposit_enabled: boolean;
};
export default function DepositCryptoScreen({ navigation }: any) {
  const user = useSelector(selectUser);

  // Use the correct types from user
const [cryptoAssets, setCryptoAssets] = useState<UserCryptoAsset[]>(user?.crypto_assets ?? []);

  const [networks, setNetworks] = useState<UserNetwork[]>([]);
  const [cryptoAsset, setCryptoAsset] = useState<string>("");
  const [cryptoNetworkId, setCryptoNetworkId] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
   const [amount, setAmount] = useState<string>(""); 
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  useEffect(() => {
  setCryptoAssets(user?.crypto_assets ?? []);
}, [user?.crypto_assets]);

  // Update networks when asset changes
  useEffect(() => {
    const selectedAsset = cryptoAssets.find((a) => a.symbol === cryptoAsset);
    if (selectedAsset) {
      setNetworks(selectedAsset.networks);
      setCryptoNetworkId("");
    } else {
      setNetworks([]);
    }
  }, [cryptoAsset]);

  // Update wallet address and QR code when network changes
  useEffect(() => {
    const selectedNetwork = networks.find(
      (n) => n.id === parseInt(cryptoNetworkId)
    );

    if (selectedNetwork) {
      
  setWalletAddress(selectedNetwork.deposit_address);

  const qr =
  selectedNetwork.qr_code?.startsWith("http")
    ? selectedNetwork.qr_code
    : selectedNetwork.qr_code
    ? `${BASE_URL}/storage/${selectedNetwork.qr_code.replace(/^app\/public\//, "")}`
    : "";

  setQrUrl(qr);
    } else {
      setWalletAddress("");
      setQrUrl("");
    }
  }, [cryptoNetworkId, networks]);

  const copyAddress = async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert("Copied", "Wallet address copied to clipboard!");
  };
/**
 * 
 * @returns handle deposit request
 */
  const handleConfirmDeposit = async () => {
    if (!cryptoAsset || !cryptoNetworkId || !txHash.trim()) {
      Alert.alert("Validation", "Please fill all fields correctly.");
      return;
    }

    try {
      setLoading(true);

      API.defaults.baseURL = BASE_URL;

      await API.post(routes.api.v1.services.cryptoDeposits, {
         crypto_asset_id: cryptoAssets.find(a => a.symbol === cryptoAsset)?.id,
         crypto_network_id: cryptoNetworkId,
        tx_hash: txHash,
        amount: amount ? parseFloat(amount) : null,
      });

    // Show success modal
    setSuccessModalVisible(true);
  }  catch (err: any) {
    console.error("Deposit error:", err);

    // ✅ Extract backend error message (if any)
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Something went wrong, please try again.";

    // ✅ Detect duplicate transaction hash error
    if (errorMessage.includes("already been submitted")) {
      Alert.alert(
        "Duplicate Transaction",
        "This transaction hash has already been submitted. Please verify and try again."
      );
    }
    // ✅ Detect database-level duplicate key constraint
    else if (
      errorMessage.includes("Duplicate entry") ||
      errorMessage.includes("UNIQUE constraint failed")
    ) {
      Alert.alert(
        "Duplicate Transaction",
        "This transaction hash has already been used. Please verify your TxID and try again."
      );
    }
    // ✅ Detect Laravel validation errors (like field missing)
    else if (err.response?.data?.errors) {
      const errors = err.response.data.errors;
      const firstError =
        Object.values(errors).flat().join("\n") ||
        "Please check your input and try again.";
      Alert.alert("Validation Error", firstError);
    }
    // ✅ Generic fallback for other issues
    else {
      Alert.alert("Deposit Failed", errorMessage);
    }

  } finally {
    setLoading(false);
  }
};
  
return (
  <ScrollView
    contentContainerStyle={tw`flex-grow bg-white px-3 py-4`}
    showsVerticalScrollIndicator={false}
  >
    <View style={tw`gap-3`}>
      {/* Coin Picker */}
      <View>
        <Text style={tw`mb-1 text-sm font-medium`}>Select Coin</Text>
        <Picker
          selectedValue={cryptoAsset}
          onValueChange={(itemValue) => setCryptoAsset(itemValue)}
          style={tw`border rounded bg-gray-100 text-sm py-0.2`}
        >
          <Picker.Item label="Select Coin" value="" />
          {cryptoAssets.map((asset) => (
            <Picker.Item
              key={asset.id}
              label={`${asset.symbol.toUpperCase()} ${!asset.deposit_enabled ? "(Disabled)" : ""}`}
              value={asset.deposit_enabled ? asset.symbol : ""}
            />
          ))}
        </Picker>
      </View>

      {/* Network Picker */}
      {networks.length > 0 && (
        <View>
          <Text style={tw`mb-1 text-sm font-medium`}>Select Network</Text>
          <Picker
            selectedValue={cryptoNetworkId}
            onValueChange={(itemValue) => setCryptoNetworkId(itemValue)}
            style={tw`border rounded bg-gray-100 text-sm py-0.`}
          >
            <Picker.Item label="Select Network" value="" />
            {networks.map((network) => (
              <Picker.Item key={network.id} label={network.name} value={network.id.toString()} />
            ))}
          </Picker>
        </View>
      )}

      {/* Wallet Address */}
      {walletAddress ? (
        <View>
          <Text style={tw`mb-0.5 text-sm font-medium`}>Wallet Address</Text>
          <Text style={tw`p-4 bg-gray-100 rounded text-xs break-words`}>
            {walletAddress}
          </Text>
          <TouchableOpacity onPress={copyAddress}>
            <Text style={tw`text-blue-600 mt-0.5 text-xs`}>Copy Address</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* QR Code */}
      {qrUrl ? (
        <View style={tw`items-center`}>
          <Text style={tw`mb-0.5 text-sm font-medium`}>Scan QR Code</Text>
          <Image
            source={{ uri: qrUrl }}
            style={tw`w-36 h-36 border rounded`}
            resizeMode="contain"
          />
        </View>
      ) : null}

      {/* Amount Field */}
      <View>
        <Text style={tw`mb-0.5 text-sm font-medium`}>Deposit Amount</Text>
        <TextInput
  style={tw`px-4 py-3 mb-4 bg-gray-100 shadow-sm border border-gray-200 rounded-lg`}
          placeholder="Enter amount (e.g. 0.01 BTC)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      {/* Tx Hash */}
      <View>
        <Text style={tw`mb-0.5 text-sm font-medium`}>Transaction Hash (Tx ID)</Text>
        <TextInput
  style={tw`px-4 py-3 mb-4 bg-gray-100 shadow-sm border border-gray-200 rounded-lg`}
          placeholder="Paste transaction hash"
          value={txHash}
          onChangeText={setTxHash}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        disabled={loading}
        onPress={handleConfirmDeposit}
        style={tw`bg-blue-600 py-2 rounded`}
      >
        <Text style={tw`text-white text-center font-semibold text-sm`}>
          {loading ? "Submitting..." : "I've Sent the Funds"}
        </Text>
      </TouchableOpacity>
    </View>

    {/* Success Modal */}
    <TransactionSuccessModal
      visible={successModalVisible}
      title="Deposit Submitted 🎉"
      message="Your deposit request has been submitted successfully. It will be credited shortly."
      onClose={() => setSuccessModalVisible(false)}
    />
  </ScrollView>
  );
}
