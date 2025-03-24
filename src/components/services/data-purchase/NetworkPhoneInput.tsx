import React, { useState, useCallback, useMemo } from "react";
import { View, TouchableOpacity, Modal, Dimensions, Animated, Pressable, ScrollView } from "react-native";
import { IconButton, Text } from "react-native-paper";
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
  const values = watch();
  const [networkModalVisible, setNetworkModalVisible] = useState(false);

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
      data_bundle: undefined,
      data_amount: "",
      amount: "0",
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
      <View style={tw`flex-1 bg-black/50 justify-center items-center px-4`}>
        <Animated.View 
          style={[
            tw`bg-white rounded-2xl w-full max-w-md shadow-xl`,
            {
              transform: [{ scale: animatedScale }],
              opacity: animatedOpacity
            }
          ]}
        >
          <View style={tw`p-5 border-b border-gray-100`}>
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-gray-900 font-bold text-lg`}>Select Network</Text>
              <TouchableOpacity
                onPress={() => setNetworkModalVisible(false)}
                style={tw`p-2 rounded-full bg-gray-100 active:bg-gray-200`}
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
                    style={tw`flex-row items-center p-4 rounded-xl mb-1 ${values.provider === provider.serviceId ? 'bg-primary/10' : 'active:bg-gray-50'}`}
                    onPress={() => handleNetworkChange(provider.serviceId)}
                  >
                    <View style={tw`h-12 w-12 rounded-full overflow-hidden bg-gray-100 justify-center items-center shadow-sm`}>
                      <AvatarImage 
                        avatar={provider.logo} 
                        size={48} 
                        style={tw`rounded-full`}
                      />
                    </View>
                    <Text style={tw`ml-3 font-medium text-base flex-1 ${values.provider === provider.serviceId ? 'text-primary font-bold' : 'text-gray-800'}`}>
                      {provider.name}
                    </Text>
                    {values.provider === provider.serviceId && (
                      <View style={tw`bg-primary rounded-full p-1`}>
                        <Check size={16} color="white" />
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
    <View style={tw`mt-2 mb-5`}>
      <View style={tw`min-h-[70px]`}>
        <View style={tw`flex-row items-start gap-3`}>
          {/* Custom Network Dropdown Button */}
          <Pressable
            style={tw.style(
              `h-14 w-14 rounded-full justify-center items-center overflow-hidden shadow-md flex-shrink-0`,
              selectedProvider 
                ? `border-2 border-primary bg-white`
                : `border border-gray-200 bg-white`
            )}
            onPress={() => setNetworkModalVisible(true)}
          >
            {selectedProvider ? (
              <AvatarImage 
                avatar={selectedProvider.logo} 
                size={40} 
                style={tw`rounded-full bg-white`} 
              />
            ) : (
              <View style={tw`h-14 w-14 rounded-full bg-gray-100 justify-center items-center`}>
                <User size={22} color={tw.color("gray-500")} fill={tw.color("gray-200")} />
              </View>
            )}
          </Pressable>

          {/* Phone Input */}
          <View style={tw`flex-1 relative`}>
            <View style={tw`flex-row items-start`}>
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
              <IconButton
                icon={() => <User size={20} color={tw.color("primary")} />}
                onPress={onOpenContactModal}
                mode="contained"
                iconColor={tw.color("primary")}
                containerColor={tw.color('primary-50')}
                style={tw`mt-0`}
              />
            </View>
          </View>
        </View>
      </View>
      
      {networkSelectionModal}
    </View>
  );
};

export default React.memo(NetworkPhoneInput);
