import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "@lib/tailwind";
import CryptoWithdrawalOtpModal from "@components/ui/modals/CryptoWithdrawalOtpModal";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import { Picker } from '@react-native-picker/picker';
import EnterOtpBottomSheet from "@components/ui/modals/CryptoWithdrawalOtpModal";
import { formattedBalance } from "@utils/transactionutils";

type Network = { id: number; name: string; fee: number; min_withdrawal: number };

const WithdrawCryptoScreen = ({ navigation }: any) => {
  const user = useSelector(selectUser);

  const wallets = user?.wallet_balances ?? {};
  const cryptoAssets = user?.crypto_assets ?? [];

  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedFee, setSelectedFee] = useState<number | null>(null);
  const [amountToReceive, setAmountToReceive] = useState<number | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [localErrors, setLocalErrors] = useState<{ [key: string]: string }>({});
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "destructive" | "warning"; title: string; description: string } | null>(null);

  const [data, setData] = useState({
    crypto_type: "",
    crypto_asset_id: "",
    crypto_network_id: "",
    wallet_address: "",
    amount: "",
  });

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
    <ScrollView contentContainerStyle={tw`p-4 bg-white flex-1`}>
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

      <View style={tw`bg-white p-4 rounded-lg shadow-md`}>
        <Text style={tw`text-xl font-semibold mb-4`}>Withdraw Crypto</Text>

        {/* Coin Picker */}
        <Text style={tw`mb-2 font-medium`}>Select Coin</Text>
        <Picker
          selectedValue={data.crypto_type}
          onValueChange={(itemValue) => setData((prev) => ({ ...prev, crypto_type: itemValue, crypto_network_id: "" }))}
          style={tw`border rounded mb-4 bg-gray-100`}
        >
          <Picker.Item label="Select Coin" value="" />
          {cryptoAssets.map((asset) => (
            <Picker.Item
              key={asset.id}
              label={`${asset.symbol.toUpperCase()} ${!asset.withdrawal_enabled ? "(Disabled)" : ""}`}
              value={asset.withdrawal_enabled ? asset.symbol : ""}
            />
          ))}
        </Picker>

        {/* Network Picker */}
        {networks.length > 0 && (
          <>
            <Text style={tw`mb-1`}>Network</Text>
            <Picker
              selectedValue={data.crypto_network_id}
              onValueChange={(itemValue) => setData((prev) => ({ ...prev, crypto_network_id: itemValue }))}
              style={tw`border rounded mb-4 bg-gray-100`}
            >
              <Picker.Item label="Select Network" value="" />
              {networks.map((network) => (
                <Picker.Item
                  key={network.id}
                  label={network.name}
                  value={network.id.toString()}
                />
              ))}
            </Picker>
            {localErrors.crypto_network_id && <Text style={tw`text-red-500 mb-2`}>{localErrors.crypto_network_id}</Text>}
          </>
        )}

{/* fee */}
  {selectedFee !== null && (
          <Text style={tw`mb-2 text-gray-600`}>Network Fee: {formattedBalance(selectedFee, data.crypto_type)}</Text>
        )}
        {/* Wallet Address */}
        <Text style={tw`mb-1`}>Wallet Address</Text>
        <TextInput
          style={tw`border rounded px-2 py-2 mb-4 bg-gray-100`}
          value={data.wallet_address}
          onChangeText={(text) => setData((prev) => ({ ...prev, wallet_address: text }))}
        />
        {localErrors.wallet_address && <Text style={tw`text-red-500 mb-4`}>{localErrors.wallet_address}</Text>}

        {/* Amount */}
        <Text style={tw`mb-1`}>Amount</Text>
        <TextInput
          style={tw`border rounded px-2 py-2 mb-4 bg-gray-100`}
          keyboardType="numeric"
          value={data.amount}
          onChangeText={(text) => setData((prev) => ({ ...prev, amount: text }))}
        />
        {localErrors.amount && <Text style={tw`text-red-500 mb-2`}>{localErrors.amount}</Text>}

        {/* Balance display */}
        {balanceDisplay()}

        {/* Amount to receive */}
 {/* Amount to receive */}
        {amountToReceive !== null && (
          <Text style={tw`text-gray-700 mb-4`}>
            You will receive: {formattedBalance(amountToReceive, data.crypto_type)}
          </Text>
        )}
        {/* Next Button */}
        <Button mode="contained" onPress={handleNext}>Next</Button>
      </View>

      {showOtpModal && (
  <EnterOtpBottomSheet
    withdrawalData={data}
    visible={showOtpModal}
    onClose={() => setShowOtpModal(false)}
    onSuccessRedirect={() => navigation.navigate("Dashboard")}
  />
)}


    </ScrollView>
  );
};

export default WithdrawCryptoScreen;
