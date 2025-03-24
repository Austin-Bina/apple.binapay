import React, { useCallback } from 'react';
import { View } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import PortedNumberAccordion from '@components/ui/widgets/ported-number-accordion';

interface PortedNumberSectionProps {
  control: Control<any>;
}

const PortedNumberSection = ({ control }: PortedNumberSectionProps) => {
  // Use useCallback to memoize the onChange handler to prevent recreating it on each render
  const handleChange = useCallback((onChange: (value: boolean) => void, currentValue: boolean) => {
    return () => onChange(!currentValue);
  }, []);

  return (
    <View style={{ marginBottom: 8 }}>
      <Controller
        control={control}
        name="ported_number"
        render={({ field: { value, onChange } }) => (
          <PortedNumberAccordion
            onPress={handleChange(onChange, value)}
            checked={value}
          />
        )}
      />
    </View>
  );
};

export default React.memo(PortedNumberSection); 
