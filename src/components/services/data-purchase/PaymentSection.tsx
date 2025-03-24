import React, { useMemo } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import tw from '@lib/tailwind';
import { Control } from 'react-hook-form';
import NairaInput from '@components/ui/form/NairaInput';
import WalletBalanceHelper from '@components/ui/form/wallet-balance';
import { Package } from 'lucide-react-native';

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

  // Memoize wallet balance helper to prevent unnecessary re-renders
  const walletBalanceComponent = useMemo(() => (
    <WalletBalanceHelper {...walletValidation} />
  ), [walletValidation]);

  // Calculate a fixed height for the data amount message container to prevent layout shifts
  const messageContainerHeight = dataAmount ? 80 : 0;

  return (
    <View style={tw`mb-5`}>
      <NairaInput name="payAmount" control={control} isDisabled />
      
      {walletBalanceComponent}

      {/* Fixed height container to prevent layout shifts */}
      <View style={{ height: messageContainerHeight, overflow: 'hidden' }}>
        {dataAmount && (
          <Animated.View
            style={[
              tw`bg-green-50 flex-row justify-center items-center p-3 rounded-xl gap-2 w-full my-4`,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Package size={20} color={tw.color('green-600')} />
            <Text
              variant="bodyMedium"
              style={tw`text-green-600 text-center font-medium`}
            >
              You will get <Text style={tw`font-bold`}>{dataAmount}</Text>
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

export default React.memo(PaymentSection); 
