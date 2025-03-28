import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import tw from '@lib/tailwind';
import { Check, Filter, X } from 'lucide-react-native';
import { Portal } from 'react-native-paper';

type DataType = {
  id: string;
  label: string;
};

interface DataTypesSelectionProps {
  dataTypes: DataType[];
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

const DataTypesSelection = ({
  dataTypes,
  selectedType,
  onTypeSelect,
}: DataTypesSelectionProps) => {
  const [isMoreTypesModalVisible, setIsMoreTypesModalVisible] = useState(false);
  const [scrollViewRef, setScrollViewRef] = useState<ScrollView | null>(null);
  
  const reorderedDataTypes = useMemo(() => {
    if (!selectedType || !dataTypes.length) return dataTypes;
    
    const selected = dataTypes.find(type => type.id === selectedType);
    if (!selected) return dataTypes;
    
    return [
      selected,
      ...dataTypes.filter(type => type.id !== selectedType)
    ];
  }, [dataTypes, selectedType]);
  
  const MAX_DISPLAY_ITEMS = 4;
  
  const displayTypes = useMemo(() => {
    return reorderedDataTypes.slice(0, MAX_DISPLAY_ITEMS);
  }, [reorderedDataTypes]);

  const hasMoreTypes = useMemo(() => {
    return reorderedDataTypes.length > MAX_DISPLAY_ITEMS;
  }, [reorderedDataTypes]);

  const selectedTypeObject = useMemo(() => {
    return dataTypes.find(type => type.id === selectedType);
  }, [dataTypes, selectedType]);

  useEffect(() => {
    if (scrollViewRef && selectedType) {
      // Give time for the layout to complete
      setTimeout(() => {
        scrollViewRef.scrollTo({ x: 0, animated: true });
      }, 100);
    }
  }, [selectedType, scrollViewRef]);

  const renderDataTypeTab = useCallback((type: DataType, isActive: boolean) => (
    <TouchableOpacity
      key={type.id}
      onPress={() => onTypeSelect(type.id)}
      style={[
        tw`px-4 py-2.5 mr-3 border shadow-sm`,
        isActive 
          ? tw`bg-primary border-primary`
          : tw`bg-white border-gray-200 active:bg-gray-50`,
        tw`rounded-2xl`,
      ]}
    >
      <View style={tw`flex-row items-center`}>
        {isActive && (
          <View style={tw`h-4 w-4 rounded-full bg-white/20 items-center justify-center mr-1.5`}>
            <Check size={10} color="white" />
          </View>
        )}
        <Text
          style={[
            tw`font-medium`,
            isActive ? tw`text-white` : tw`text-gray-700`,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {type.label}
        </Text>
      </View>
    </TouchableOpacity>
  ), [onTypeSelect]);

  const dataTypeTabs = useMemo(() => (
    <ScrollView
      ref={setScrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tw`py-1 px-4`}
      style={tw`-mx-4`}
      snapToInterval={120}
      decelerationRate="fast"
    >
      {reorderedDataTypes.length > 0 ? (
        <>
          {displayTypes.map((dataType) =>
            renderDataTypeTab(
              dataType,
              selectedType === dataType.id
            )
          )}
          
          {hasMoreTypes && (
            <TouchableOpacity
              onPress={() => setIsMoreTypesModalVisible(true)}
              style={tw`px-4 py-2.5 rounded-2xl border border-gray-200 bg-white flex-row items-center shadow-sm active:bg-gray-50 mr-4`}
            >
              <Filter size={14} color={tw.color('gray-600')} />
              <Text style={tw`text-gray-700 font-medium ml-1.5`}>More</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text style={tw`text-gray-500 py-2 italic px-4`}>No data types available</Text>
      )}
    </ScrollView>
  ), [displayTypes, selectedType, hasMoreTypes, renderDataTypeTab, reorderedDataTypes.length]);

  const allTypesModal = useMemo(() => (
    <Portal>
      <Modal
        visible={isMoreTypesModalVisible}
        onDismiss={() => setIsMoreTypesModalVisible(false)}
        transparent
        animationType="slide"
      >
        <View style={tw`flex-1 bg-black/60 justify-center items-center px-4`}>
          <View 
            style={[
              tw`bg-white rounded-3xl w-full max-w-md shadow-2xl`,
              {
                maxHeight: Math.min(600, Dimensions.get('window').height * 0.8),
              }
            ]}
          >
            <View style={tw`p-5 border-b border-gray-100`}>
              <View style={tw`flex-row justify-between items-center mb-1`}>
                <Text style={tw`text-gray-900 font-bold text-xl`}>Data Types</Text>
                <TouchableOpacity
                  onPress={() => setIsMoreTypesModalVisible(false)}
                  style={tw`p-2 rounded-full bg-gray-100 active:bg-gray-200`}
                >
                  <X size={18} color={tw.color('gray-600')} />
                </TouchableOpacity>
              </View>
              <Text style={tw`text-gray-500 text-sm`}>Select a data type to continue</Text>
            </View>
            
            <ScrollView 
              style={tw`max-h-[60vh]`} 
              contentContainerStyle={tw`p-4`}
              showsVerticalScrollIndicator={false}
            >
              <View style={tw`flex-row flex-wrap justify-center`}>
                {reorderedDataTypes.map((dataType) => (
                  <TouchableOpacity
                    key={dataType.id}
                    onPress={() => {
                      onTypeSelect(dataType.id);
                      setIsMoreTypesModalVisible(false);
                    }}
                    style={[
                      tw`px-4 py-3.5 rounded-2xl border mx-1.5 mb-3 shadow-sm min-w-[120px]`,
                      selectedType === dataType.id
                        ? tw`bg-primary border-primary`
                        : tw`bg-white border-gray-200 active:bg-gray-50`,
                    ]}
                  >
                    <View style={tw`flex-row items-center justify-center`}>
                      {selectedType === dataType.id && (
                        <View style={tw`h-5 w-5 rounded-full bg-white/20 items-center justify-center mr-2`}>
                          <Check size={12} color="white" />
                        </View>
                      )}
                      <Text
                        style={[
                          tw`font-medium text-center`,
                          selectedType === dataType.id ? tw`text-white` : tw`text-gray-800`,
                        ]}
                      >
                        {dataType.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Portal>
  ), [isMoreTypesModalVisible, reorderedDataTypes, selectedType, onTypeSelect]);

  const selectedTypeHeader = useMemo(() => {
    if (!selectedTypeObject) return null;
    
    return (
      <View style={tw`mb-4 px-4`}>
        <Text style={tw`text-gray-500 text-sm font-medium`}>Selected Data Type</Text>
        <View style={tw`flex-row items-center mt-1.5`}>
          <View style={tw`h-6 w-6 rounded-full bg-primary/15 items-center justify-center mr-2.5`}>
            <Check size={14} color={tw.color('primary')} />
          </View>
          <Text style={tw`text-primary font-bold text-base`}>
            {selectedTypeObject.label}
          </Text>
        </View>
      </View>
    );
  }, [selectedTypeObject]);

  return (
    <View style={tw`mb-6`}>
      {dataTypes.length > 0 && (
        <>
          {selectedTypeHeader}
          <View style={tw`h-[56px] justify-center`}>
            {dataTypeTabs}
          </View>
        </>
      )}
      
      {allTypesModal}
    </View>
  );
};

export default React.memo(DataTypesSelection); 
