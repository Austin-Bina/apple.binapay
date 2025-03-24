import React, { useMemo } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import tw from '@lib/tailwind';
import { Control } from 'react-hook-form';
import NairaInput from '@components/ui/form/NairaInput';
import WalletBalanceHelper from '@components/ui/form/wallet-balance';
import { Package, CreditCard } from 'lucide-react-native';

interface PaymentSectionProps {
  control: Control<any>;
  dataAmount: string;
  walletValidation: any;
}

const PaymentSection = ({ control, dataAmount, walletValidation }: PaymentSectionProps) => {
  // Animation for data amount message
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  
  // Animate when dataAmount changes
  React.useEffect(() => {
    if (dataAmount) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Reset animation values when dataAmount is empty
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [dataAmount, fadeAnim, scaleAnim]);

  const walletBalanceComponent = useMemo(() => (
    <WalletBalanceHelper {...walletValidation} />
  ), [walletValidation]);

  // Calculate a fixed height for the data amount message container to prevent layout shifts
  const messageContainerHeight = dataAmount ? 150 : 0;

  return (
    <View style={tw`mb-5`}>
      <View style={tw`mb-3`}>
        <NairaInput 
          name="amount" 
          control={control} 
          isDisabled 
        />
      </View>
      
      {walletBalanceComponent}

      {/* Fixed height container to prevent layout shifts */}
      <View style={{ height: messageContainerHeight, overflow: 'hidden' }}>
        {dataAmount && (
          <Animated.View
            style={[
              tw`bg-green-50 rounded-2xl shadow-sm overflow-hidden mt-4`,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={tw`px-5 py-3 border-b border-green-100`}>
              <Text style={tw`text-green-800 font-bold`}>Bundle Summary</Text>
            </View>
            
            <View style={tw`p-4 flex-row items-center`}>
              <View style={tw`h-10 w-10 rounded-full bg-green-100 justify-center items-center mr-3`}>
                <Package size={18} color={tw.color('green-600')} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-gray-600 text-xs mb-0.5`}>You will receive</Text>
                <Text style={tw`text-green-700 font-bold text-base`}>
                  {dataAmount}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

export default React.memo(PaymentSection); 
