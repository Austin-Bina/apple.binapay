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
import DropDownPicker from "react-native-dropdown-picker";
import { useSelector } from "react-redux";
import { CryptoAsset as UserCryptoAsset, Network as UserNetwork } from "@type/user"; // adjust path
import TransactionSuccessModal from "@components/ui/modals/TransactionSuccessModal";
import ScrollableView from "@components/ui/shared/ScrollableView";

type Network = {
  id: number;
  name: string;
  deposit_address: string;
  qr_code: string | null;
  network_slug: string;
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
 const [coinOpen, setCoinOpen] = useState(false);
const [networkOpen, setNetworkOpen] = useState(false);

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
  <View style={tw`flex-1 bg-white`}>
    
    <ScrollableView
     contentContainerStyle={tw`p-4 pb-32 z-10`}
      showsVerticalScrollIndicator={false}
    >
      <View style={tw`gap-3`}>
        {/* Coin Picker */}
        <View>
         <Text style={tw`mb-1 text-sm font-medium`}>Select Coin</Text>
<DropDownPicker
  open={coinOpen}
  value={cryptoAsset}
  items={cryptoAssets.map((asset) => ({
    label: `${asset.symbol.toUpperCase()} ${!asset.deposit_enabled ? "(Disabled)" : ""}`,
    value: asset.symbol,
    disabled: !asset.deposit_enabled, // disables selection
  }))}
  setOpen={setCoinOpen}
  setValue={(callback) => setCryptoAsset(callback(cryptoAsset))}
  placeholder="Select Coin"
  style={tw`bg-gray-100 border-gray-300 rounded-lg mb-4`}
       dropDownContainerStyle={tw`bg-white border-gray-300 rounded-lg`}
  listMode="SCROLLVIEW"
  zIndex={3000}
/>


        </View>

        {/* Network Picker */}
        {networks.length > 0 && (
          <View>
          {networks.length > 0 && (
  <>
    <Text style={tw`mb-1 text-sm font-medium`}>Select Network</Text>
    <DropDownPicker
      open={networkOpen}
      value={cryptoNetworkId}
      items={networks.map((n) => ({
        label: `${n.name} (${n.network_slug})`,
        value: n.id.toString(),
      }))}
      setOpen={setNetworkOpen}
      setValue={(callback) => setCryptoNetworkId(callback(cryptoNetworkId))}
      placeholder="Select Network"
      style={tw`bg-gray-100 border-gray-300 rounded-lg mb-4`}
       dropDownContainerStyle={tw`bg-white border-gray-300 rounded-lg`}
      listMode="SCROLLVIEW"
      zIndex={2000}
    />
  </>
)}


          </View>
        )}

        {/* Wallet Address */}
        {walletAddress ? (
          <View>
            <Text style={tw`mb-0.5 text-sm font-medium`}>Wallet Address</Text>
            <Text style={tw`p-2 bg-gray-100 rounded text-base break-words`}>
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

        {/* Warning */}
        {cryptoAsset && cryptoNetworkId ? (
          <View style={tw`mb-2 p-2 bg-yellow-100 border-l-4 border-yellow-500 rounded`}>
            <Text style={tw`text-xs text-yellow-800`}>
              ⚠️ Make sure to send{' '}
              <Text style={tw`text-blue-600`}>{cryptoAsset.toUpperCase()}</Text>{' '}
              on the{' '}
              <Text style={tw`text-blue-600`}>
                {networks.find(n => n.id === parseInt(cryptoNetworkId))?.name}
              </Text>{' '}
              network, and click "I've Sent the Funds" after completing the transfer.
            </Text>
          </View>
        ) : null}

        {/* Tx Hash */}
        <View>
          <Text style={tw`mb-0.5 text-sm font-medium`}>Transaction Hash (Tx ID)</Text>
          <TextInput
            style={tw`px-4 py-3 mb-4 bg-gray-100 shadow-sm border border-gray-200 rounded-lg`}
            placeholder="Paste transaction hash"
            value={txHash}
             onChangeText={(text) => setTxHash(text.replace(/\s+/g, ""))} 
          />
        </View>
      </View>
    </ScrollableView>

    {/* FIXED BOTTOM BUTTON */}
    <View
      style={[
        tw`absolute left-0 right-0 bg-white p-4`,
        {
          bottom: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
      ]}
    >
      <TouchableOpacity
        disabled={loading}
        onPress={handleConfirmDeposit}
        style={[
          tw`py-3 rounded-xl`,
          { backgroundColor: loading ? "#3b82f6AA" : "#2563eb" },
        ]}
      >
        <Text style={tw`text-white text-center font-semibold text-base`}>
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
  </View>
);
}
