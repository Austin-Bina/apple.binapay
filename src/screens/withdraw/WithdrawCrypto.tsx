import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "@lib/tailwind";
import CryptoWithdrawalOtpModal from "@components/ui/modals/CryptoWithdrawalOtpModal";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import DropDownPicker from "react-native-dropdown-picker";
import EnterOtpBottomSheet from "@components/ui/modals/CryptoWithdrawalOtpModal";
import { formattedBalance } from "@utils/transactionutils";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { useCrypto } from "../home/CryptoContext";

type Network = {
  id: number;
  name: string;
  fee: number;
  min_withdrawal: number;
  network_slug: string; // <- add this
};

const WithdrawCryptoScreen = ({ navigation }: any) => {
  const user = useSelector(selectUser);

  const wallets = user?.wallet_balances ?? {};
  const cryptoAssets = user?.crypto_assets ?? [];

  const [coinOpen, setCoinOpen] = useState(false);
const [networkOpen, setNetworkOpen] = useState(false);

  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedFee, setSelectedFee] = useState<number | null>(null);
  const [amountToReceive, setAmountToReceive] = useState<number | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [localErrors, setLocalErrors] = useState<{ [key: string]: string }>({});
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "destructive" | "warning"; title: string; description: string } | null>(null);
  const { assets } = useCrypto();
  useEffect(() => {
  console.log("📊 Crypto assets from context:", assets);
}, [assets]);

    const [data, setData] = useState({
    crypto_type: "",
    crypto_asset_id: "",
    crypto_network_id: "",
    wallet_address: "",
    network_slug: "",
    amount: "",
  });
const selectedAsset = assets?.find(a => a.symbol === data.crypto_type);
const priceUsd = selectedAsset?.price_usd ?? 0;
const feeInUsd = selectedFee && priceUsd ? (selectedFee * priceUsd) : 0;

  // Auto-clear alert
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Load networks when crypto changes
  useEffect(() => {
    const selectedCrypto = cryptoAssets.find((c) => c.symbol === data.crypto_type);
    if (selectedCrypto) {
      setNetworks(selectedCrypto.networks);
       // 🔹 Log networks to debug
    console.log("Selected Crypto Networks:", selectedCrypto.networks);
      setData((prev) => ({ ...prev, crypto_asset_id: selectedCrypto.id.toString() }));
    } else {
      setNetworks([]);
      setData((prev) => ({ ...prev, crypto_asset_id: "", crypto_network_id: "" }));
      setSelectedFee(null);
    }
  }, [data.crypto_type, cryptoAssets]);

  // Fee calculation
  useEffect(() => {
    const selectedNetwork = networks.find((n) => n.id === parseInt(data.crypto_network_id));
    setSelectedFee(selectedNetwork ? selectedNetwork.fee : null);
  }, [data.crypto_network_id, networks]);

  // Calculate receive amount
  useEffect(() => {
    const fee = selectedFee ?? 0;
    const amount = parseFloat(data.amount);
    setAmountToReceive(!isNaN(amount) && amount > 0 ? amount - fee : null);
  }, [data.amount, selectedFee]);

  // Minimum withdrawal warning
  useEffect(() => {
    const selectedNetwork = networks.find((n) => n.id === parseInt(data.crypto_network_id));
    const inputAmount = parseFloat(data.amount);
    const assetSymbol = cryptoAssets.find((c) => c.symbol === data.crypto_type)?.symbol;

       if (selectedNetwork && !isNaN(inputAmount) && inputAmount < selectedNetwork.min_withdrawal) {
      setAlertMessage({
        type: "warning",
        title: "Minimum Withdrawal",
        description: `Minimum withdrawal for ${selectedNetwork.name} is ${formattedBalance(
          selectedNetwork.min_withdrawal,
          assetSymbol ?? "CRYPTO"
        )}`,
      });
    }
  }, [data.amount, data.crypto_network_id, networks, cryptoAssets, data.crypto_type]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let valid = true;

    if (!data.wallet_address.trim()) {
      newErrors.wallet_address = "Wallet address is required.";
      valid = false;
    }
    if (!data.amount.trim() || parseFloat(data.amount) <= 0) {
      newErrors.amount = "Enter a valid amount.";
      valid = false;
    }
    if (!data.crypto_type) {
      newErrors.crypto_type = "Please select a crypto asset.";
      valid = false;
    }
    if (!data.crypto_network_id) {
      newErrors.crypto_network_id = "Please select a network.";
      valid = false;
    }

    setLocalErrors(newErrors);
    return valid;
  };

  const checkBalanceBeforeOtp = () => {
    const symbol = data.crypto_type.toLowerCase();
    const balance = parseFloat(wallets[symbol]?.balance ?? "0");

    if (parseFloat(data.amount) > balance) {
      setAlertMessage({
        type: "destructive",
        title: "Insufficient Balance",
        description: `Your wallet has ${formattedBalance(balance, data.crypto_type)}, which is less than the amount entered.`,
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateForm() && checkBalanceBeforeOtp()) {
      setShowOtpModal(true);
    }
  };

  const balanceDisplay = () => {
    if (!data.crypto_type) return null;
    const balance = wallets[data.crypto_type.toLowerCase()]?.balance ?? 0;
    return (
      <Text style={tw`text-gray-600 mb-2`}>
        Your balance: {formattedBalance(balance, data.crypto_type)}
      </Text>
    );
  };


  return (
  <View style={tw`flex-1 bg-white`}>

    {/* STATIC TITLE */}
    <View style={tw`p-4 bg-white shadow`}>
      <Text style={tw`text-xl font-semibold`}>Withdraw Crypto</Text>
    </View>

    {/* SCROLLABLE CONTENT */}
    <ScrollableView
      contentContainerStyle={tw`p-4 pb-32 z-10`} // add bottom space so content doesn't hide behind button
      showsVerticalScrollIndicator={false}
    >
      {alertMessage && (
        <View
          style={[
            tw`p-3 mb-4 rounded border-l-4`,
            alertMessage.type === "success"
              ? tw`bg-green-50 border-green-400`
              : alertMessage.type === "destructive"
              ? tw`bg-red-50 border-red-400`
              : tw`bg-yellow-50 border-yellow-400`,
          ]}
        >
          <Text style={tw`font-bold`}>{alertMessage.title}</Text>
          <Text>{alertMessage.description}</Text>
        </View>
      )}
       {/* COIN DROPDOWN */}
<Text style={tw`mb-2 font-medium`}>Select Coin</Text>

<DropDownPicker
  open={coinOpen}
  value={data.crypto_type}
  items={cryptoAssets.map((asset) => ({
  label: `${asset.symbol.toUpperCase()} ${!asset.withdrawal_enabled ? "(Disabled)" : ""}`,
  value: asset.symbol, // always a string
  disabled: !asset.withdrawal_enabled, // disables selection
}))}


  setOpen={setCoinOpen}
  setValue={(callback) =>
    setData((prev) => ({
      ...prev,
      crypto_type: callback(prev.crypto_type),
      crypto_network_id: "",
    }))
  }

  placeholder="Select Coin"
  style={tw`bg-gray-100 border-gray-300 rounded-lg mb-4`}
  dropDownContainerStyle={tw`bg-white border-gray-300 rounded-lg`}
  listMode="SCROLLVIEW"
  zIndex={3000}
/>

{localErrors.crypto_type && (
  <Text style={tw`text-red-500 mb-2`}>{localErrors.crypto_type}</Text>
)}

       
        {/* NETWORK DROPDOWN */}
{networks.length > 0 && (
  <>
    <Text style={tw`mb-2 font-medium`}>Network</Text>

    <DropDownPicker
      open={networkOpen}
      value={data.crypto_network_id}
      items={networks.map((network) => ({
        label: `${network.name} (${network.network_slug})`,
        value: network.id.toString(),
      }))}

      setOpen={setNetworkOpen}
      setValue={(callback) =>
        setData((prev) => ({
          ...prev,
          crypto_network_id: callback(prev.crypto_network_id),
        }))
      }

      placeholder="Select Network"
      style={tw`bg-gray-100 border-gray-300 rounded-lg mb-4`}
      dropDownContainerStyle={tw`bg-white border-gray-300 rounded-lg`}
      listMode="SCROLLVIEW"
      zIndex={2000}
    />

    {localErrors.crypto_network_id && (
      <Text style={tw`text-red-500 mb-2`}>{localErrors.crypto_network_id}</Text>
    )}
  </>
)}


{/* fee */}

  {selectedFee !== null && (
  <Text style={tw`mb-2 text-gray-600`}>
    Network Fee: {formattedBalance(selectedFee, data.crypto_type)}
    {feeInUsd > 0 && ` ($${formattedBalance(feeInUsd, "", 2)})`}
  </Text>
)}

        {/* Wallet Address */}
        <Text style={tw`mb-1`}>Wallet Address</Text>
        <TextInput
  style={tw`px-4 py-3 mb-4 bg-gray-100 shadow-sm border border-gray-200 rounded-lg`}
  placeholder="Enter wallet address"
  placeholderTextColor="#9CA3AF"
  value={data.wallet_address}
  onChangeText={(text) => setData((prev) => ({ ...prev, wallet_address: text }))}
/>

        {localErrors.wallet_address && <Text style={tw`text-red-500 mb-4`}>{localErrors.wallet_address}</Text>}

        {/* Amount */}
       {/* Amount */}
<Text style={tw`mb-1`}>Amount</Text>

<View
  style={tw`flex-row items-center mb-4 bg-gray-100 shadow-sm border border-gray-200 rounded-lg`}
>
  <TextInput
    style={tw`flex-1 px-4 py-3`}
    placeholder="Enter amount"
    placeholderTextColor="#9CA3AF"
    keyboardType="numeric"
    value={data.amount}
    onChangeText={(text) =>
      setData((prev) => ({ ...prev, amount: text }))
    }
  />

  {/* MAX BUTTON */}
  <TouchableOpacity
    style={tw`px-3 py-2 mr-3 bg-blue-600 rounded-md`}
    onPress={() => {
      const balance =
        wallets[data.crypto_type.toLowerCase()]?.balance ?? 0;

      setData((prev) => ({
        ...prev,
        amount: String(balance),
      }));
    }}
  >
    <Text style={tw`text-white font-semibold`}>MAX</Text>
  </TouchableOpacity>
</View>

{localErrors.amount && (
  <Text style={tw`text-red-500 mb-2`}>{localErrors.amount}</Text>
)}

        {/* Balance display */}
        {balanceDisplay()}

        {/* Amount to receive */}
 {/* Amount to receive */}
        {amountToReceive !== null && (
          <Text style={tw`text-gray-700 mb-4`}>
            You will receive: {formattedBalance(amountToReceive, data.crypto_type)}
          </Text>
        )}
         {/* --- YOUR FORM CONTENT ENDS HERE --- */}
    </ScrollableView>
   {/* FIXED BOTTOM BUTTON */}
<View
  style={[
    tw`absolute left-0 right-0 p-4 bg-white`,
    {
      bottom: 0,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      elevation: 12, // Android soft shadow
      shadowColor: "#000", // iOS shadow
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      paddingTop: 32,
    paddingBottom: 32,
    },
  ]}
>
  <Button
    mode="contained"
    contentStyle={tw`py-2.5`}
    style={tw`rounded-xl`}
    onPress={handleNext}
  >
    Next
  </Button>
</View>


    {showOtpModal && (
      <EnterOtpBottomSheet
        withdrawalData={data}
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onSuccessRedirect={() => navigation.navigate("Dashboard")}
      />
    )}
  </View>
);
}
export default WithdrawCryptoScreen;


