import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import tw from '@lib/tailwind';
import { Check, Plus, X } from 'lucide-react-native';
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
  const theme = useTheme();
  const [isMoreTypesModalVisible, setIsMoreTypesModalVisible] = useState(false);
  
  // Limit to 3 items for display in the main view
  const displayTypes = useMemo(() => {
    return dataTypes.slice(0, 3);
  }, [dataTypes]);

  // Determine if we need a "More" button
  const hasMoreTypes = useMemo(() => {
    return dataTypes.length > 3;
  }, [dataTypes]);

  const renderDataTypeTab = useCallback((type: DataType, isActive: boolean) => (
    <TouchableOpacity
      key={type.id}
      onPress={() => onTypeSelect(type.id)}
      style={[
        tw`px-3 py-2 rounded-lg mr-2 border shadow-sm`,
        isActive 
          ? tw`bg-primary border-primary`
          : tw`bg-white border-gray-200`,
      ]}
    >
      <View style={tw`flex-row items-center`}>
        <Text
          style={[
            tw`font-medium text-xs`,
            isActive ? tw`text-white` : tw`text-gray-700`,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {type.label}
        </Text>
        {isActive && (
          <Check size={12} color="white" style={tw`ml-1`} />
        )}
      </View>
    </TouchableOpacity>
  ), [onTypeSelect]);

  // Horizontal list of data type tabs
  const dataTypeTabs = useMemo(() => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tw`py-1`}
      style={tw`-mx-4 px-4`}
    >
      {displayTypes.map((dataType) =>
        renderDataTypeTab(
          dataType,
          selectedType === dataType.id
        )
      )}
      
      {hasMoreTypes && (
        <TouchableOpacity
          onPress={() => setIsMoreTypesModalVisible(true)}
          style={tw`px-3 py-2 rounded-lg border border-gray-200 bg-white flex-row items-center shadow-sm`}
        >
          <Plus size={12} color={tw.color('gray-600')} />
          <Text style={tw`text-gray-700 font-medium text-xs ml-1`}>More</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  ), [displayTypes, selectedType, hasMoreTypes, renderDataTypeTab]);

  // Modal for showing all data types
  const allTypesModal = useMemo(() => (
    <Portal>
      <Modal
        visible={isMoreTypesModalVisible}
        onDismiss={() => setIsMoreTypesModalVisible(false)}
        transparent
        animationType="fade"
      >
        <View style={tw`flex-1 bg-black/30 justify-center items-center px-4`}>
          <View 
            style={[
              tw`bg-white rounded-xl w-full max-w-md p-4 shadow-lg`,
              {
                maxHeight: Math.min(500, Dimensions.get('window').height * 0.8),
              }
            ]}
          >
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-gray-900 font-bold text-lg`}>All Data Types</Text>
              <TouchableOpacity
                onPress={() => setIsMoreTypesModalVisible(false)}
                style={tw`p-1.5 rounded-md bg-gray-100`}
              >
                <X size={18} color={tw.color('gray-600')} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={tw`max-h-80`} showsVerticalScrollIndicator={false}>
              <View style={tw`flex-row flex-wrap`}>
                {dataTypes.map((dataType) => (
                  <TouchableOpacity
                    key={dataType.id}
                    onPress={() => {
                      onTypeSelect(dataType.id);
                      setIsMoreTypesModalVisible(false);
                    }}
                    style={[
                      tw`px-4 py-2.5 rounded-lg border mr-2 mb-2 shadow-sm`,
                      selectedType === dataType.id
                        ? tw`bg-primary border-primary`
                        : tw`bg-white border-gray-200`,
                    ]}
                  >
                    <View style={tw`flex-row items-center`}>
                      <Text
                        style={[
                          tw`font-medium`,
                          selectedType === dataType.id ? tw`text-white` : tw`text-gray-700`,
                        ]}
                      >
                        {dataType.label}
                      </Text>
                      {selectedType === dataType.id && (
                        <Check size={14} color="white" style={tw`ml-1.5`} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Portal>
  ), [isMoreTypesModalVisible, dataTypes, selectedType, onTypeSelect]);

  // Calculate a fixed height for the data types container
  const fixedContainerHeight = 46; // Height of tab (34px) + padding (12px)

  return (
    <View style={tw`mb-4`}>
      {dataTypes.length > 0 && (
        <View style={{ height: fixedContainerHeight }}>
          {dataTypeTabs}
        </View>
      )}
      
      {allTypesModal}
    </View>
  );
};

export default React.memo(DataTypesSelection); 
