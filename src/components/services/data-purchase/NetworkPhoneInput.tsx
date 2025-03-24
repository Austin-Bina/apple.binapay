import React, { useState, useCallback, useMemo } from "react";
import { View, TouchableOpacity, Modal, Dimensions, Animated, Pressable, ScrollView } from "react-native";
import { Text, useTheme } from "react-native-paper";
import tw from "@lib/tailwind";
import {
  Controller,
  Control,
  UseFormReset,
  UseFormWatch,
} from "react-hook-form";
import MaskedInput from "@components/ui/form/mask-input";
import { phone_mask } from "@constants/app";
import { User, X, Check } from "lucide-react-native";
import { AvatarImage } from "@components/avatar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NetworkPhoneInputProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  reset: UseFormReset<any>;
  dataProviders: any[];
  onOpenContactModal: () => void;
}

const NetworkPhoneInput = ({
  control,
  watch,
  reset,
  dataProviders,
  onOpenContactModal,
}: NetworkPhoneInputProps) => {
  const theme = useTheme();
  const values = watch();
  const [networkModalVisible, setNetworkModalVisible] = useState(false);
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const windowWidth = Dimensions.get("window").width;
  
  // Animation for modal
  const animatedScale = useMemo(() => new Animated.Value(0.9), []);
  const animatedOpacity = useMemo(() => new Animated.Value(0), []);
  
  // Animate modal when it becomes visible
  React.useEffect(() => {
    if (networkModalVisible) {
      Animated.parallel([
        Animated.timing(animatedScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1, 
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Reset animations when modal is hidden
      animatedScale.setValue(0.9);
      animatedOpacity.setValue(0);
    }
  }, [networkModalVisible, animatedScale, animatedOpacity]);

  // Find the selected network provider - memoize to prevent re-calculation
  const selectedProvider = useMemo(() => 
    dataProviders.find((provider) => provider.serviceId === values.provider),
  [dataProviders, values.provider]);

  const handleNetworkChange = useCallback((serviceId: string) => {
    reset({
      ...values,
      provider: serviceId,
      data_bundle: "",
      data_amount: "",
      amount: "0",
      payAmount: 0,
      type: "",
      vendor: "",
    });
    setNetworkModalVisible(false);
  }, [values, reset]);

  const contentMaxHeight = useMemo(() => {
    const { height } = Dimensions.get("window");
    return Math.min(height * 0.7, 500);
  }, []);

  // Memoize the network selection modal
  const networkSelectionModal = useMemo(() => (
    <Modal
      visible={networkModalVisible}
      transparent
      animationType="none"
      onRequestClose={() => setNetworkModalVisible(false)}
    >
      <View style={tw`flex-1 bg-black/30 justify-center items-center px-4`}>
        <Animated.View 
          style={[
            tw`bg-white rounded-xl w-full max-w-md shadow-lg`,
            {
              transform: [{ scale: animatedScale }],
              opacity: animatedOpacity
            }
          ]}
        >
          <View style={tw`p-4 border-b border-gray-100`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text style={tw`text-gray-900 font-bold text-lg`}>Select Network</Text>
              <TouchableOpacity
                onPress={() => setNetworkModalVisible(false)}
                style={tw`p-1.5 rounded-full bg-gray-100`}
              >
                <X size={18} color={tw.color('gray-600')} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={[tw`p-2`, { maxHeight: contentMaxHeight }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {dataProviders.length === 0 ? (
                <View style={tw`py-8 items-center`}>
                  <Text style={tw`text-gray-500`}>No networks found</Text>
                </View>
              ) : (
                dataProviders.map((provider) => (
                  <TouchableOpacity
                    key={provider.serviceId}
                    style={tw`flex-row items-center p-3 rounded-lg ${values.provider === provider.serviceId ? 'bg-primary/5' : ''}`}
                    onPress={() => handleNetworkChange(provider.serviceId)}
                  >
                    <View style={tw`h-10 w-10 rounded-full overflow-hidden bg-gray-100 justify-center items-center`}>
                      <AvatarImage 
                        avatar={provider.logo} 
                        size={40} 
                        style={tw`rounded-full`}
                      />
                    </View>
                    <Text style={tw`ml-3 font-medium text-gray-800 flex-1`}>
                      {provider.name}
                    </Text>
                    {values.provider === provider.serviceId && (
                      <View style={tw`bg-primary rounded-full p-1`}>
                        <Check size={12} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  ), [networkModalVisible, values.provider, dataProviders, contentMaxHeight, handleNetworkChange, animatedScale, animatedOpacity]);

  return (
    <View style={tw`mb-4`}>
      <View style={tw`min-h-[60px]`}>
        <View style={tw`flex-row items-center gap-2.5`}>
          {/* Custom Network Dropdown Button */}
          <Pressable
            style={tw.style(
              `h-12 w-12 rounded-full justify-center items-center overflow-hidden bg-white shadow-sm flex-shrink-0`,
              selectedProvider 
                ? `border-2 border-primary/20`
                : `border border-gray-200`
            )}
            onPress={() => setNetworkModalVisible(true)}
          >
            {selectedProvider ? (
              <AvatarImage 
                avatar={selectedProvider.logo} 
                size={52} 
                style={tw`rounded-full`} 
              />
            ) : (
              <View style={tw`h-12 w-12 rounded-full bg-gray-50 justify-center items-center`}>
                <User size={20} color={tw.color("gray-400")} fill={tw.color("gray-100")} />
              </View>
            )}
          </Pressable>

          {/* Phone Input */}
          <View style={tw`flex-1 relative`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`flex-1 mr-2`}>
                <Controller
                  control={control}
                  name="phone"
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <MaskedInput
                      mask={phone_mask}
                      placeholder="Enter phone number"
                      mode="outlined"
                      onBlur={onBlur}
                      value={value}
                      onChangeText={onChange}
                      error={!!error}
                      errorMessage={error?.message}
                      style={tw`flex-1 h-14`}
                    />
                  )}
                />
              </View>
              
              {/* Contact picker button */}
              <TouchableOpacity
                onPress={onOpenContactModal}
                style={tw`h-14 w-14 rounded-xl bg-gray-50 justify-center items-center border border-gray-200 shadow-sm flex-shrink-0`}
                activeOpacity={0.7}
              >
                <User size={20} color={tw.color("primary")} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      
      {networkSelectionModal}
    </View>
  );
};

export default React.memo(NetworkPhoneInput);
