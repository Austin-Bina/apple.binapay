import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import tw from '@lib/tailwind';
import { Check, Plus, X, Filter } from 'lucide-react-native';
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

  // Find the currently selected data type object
  const selectedTypeObject = useMemo(() => {
    return dataTypes.find(type => type.id === selectedType);
  }, [dataTypes, selectedType]);

  const renderDataTypeTab = useCallback((type: DataType, isActive: boolean) => (
    <TouchableOpacity
      key={type.id}
      onPress={() => onTypeSelect(type.id)}
      style={[
        tw`px-4 py-2.5 rounded-xl mr-2 border shadow-sm`,
        isActive 
          ? tw`bg-primary border-primary`
          : tw`bg-white border-gray-200 active:bg-gray-50`,
      ]}
    >
      <View style={tw`flex-row items-center`}>
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
        {isActive && (
          <Check size={14} color="white" style={tw`ml-1.5`} />
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
      {dataTypes.length > 0 ? (
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
              style={tw`px-4 py-2.5 rounded-xl border border-gray-200 bg-white flex-row items-center shadow-sm active:bg-gray-50`}
            >
              <Filter size={14} color={tw.color('gray-600')} />
              <Text style={tw`text-gray-700 font-medium ml-1.5`}>More</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text style={tw`text-gray-500 py-2 italic`}>No data types available</Text>
      )}
    </ScrollView>
  ), [displayTypes, selectedType, hasMoreTypes, renderDataTypeTab, dataTypes.length]);

  // Modal for showing all data types
  const allTypesModal = useMemo(() => (
    <Portal>
      <Modal
        visible={isMoreTypesModalVisible}
        onDismiss={() => setIsMoreTypesModalVisible(false)}
        transparent
        animationType="fade"
      >
        <View style={tw`flex-1 bg-black/50 justify-center items-center px-4`}>
          <View 
            style={[
              tw`bg-white rounded-2xl w-full max-w-md shadow-xl`,
              {
                maxHeight: Math.min(550, Dimensions.get('window').height * 0.8),
              }
            ]}
          >
            <View style={tw`p-5 border-b border-gray-100`}>
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <Text style={tw`text-gray-900 font-bold text-lg`}>Data Types</Text>
                <TouchableOpacity
                  onPress={() => setIsMoreTypesModalVisible(false)}
                  style={tw`p-2 rounded-full bg-gray-100 active:bg-gray-200`}
                >
                  <X size={18} color={tw.color('gray-600')} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={tw`max-h-80 p-3`} showsVerticalScrollIndicator={false}>
              <View style={tw`flex-row flex-wrap justify-center`}>
                {dataTypes.map((dataType) => (
                  <TouchableOpacity
                    key={dataType.id}
                    onPress={() => {
                      onTypeSelect(dataType.id);
                      setIsMoreTypesModalVisible(false);
                    }}
                    style={[
                      tw`px-4 py-3 rounded-xl border mx-1.5 mb-3 shadow-sm`,
                      selectedType === dataType.id
                        ? tw`bg-primary border-primary`
                        : tw`bg-white border-gray-200 active:bg-gray-50`,
                    ]}
                  >
                    <View style={tw`flex-row items-center justify-center min-w-[100px]`}>
                      <Text
                        style={[
                          tw`font-medium text-center`,
                          selectedType === dataType.id ? tw`text-white` : tw`text-gray-800`,
                        ]}
                      >
                        {dataType.label}
                      </Text>
                      {selectedType === dataType.id && (
                        <Check size={16} color="white" style={tw`ml-1.5`} />
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

  // Display the selected type in a nice header if there is one
  const selectedTypeHeader = useMemo(() => {
    if (!selectedTypeObject) return null;
    
    return (
      <View style={tw`mb-3 px-1`}>
        <Text style={tw`text-gray-500 text-sm font-medium`}>Selected Data Type</Text>
        <View style={tw`flex-row items-center mt-1.5`}>
          <View style={tw`h-5 w-5 rounded-full bg-primary/15 items-center justify-center mr-2`}>
            <Check size={12} color={tw.color('primary')} />
          </View>
          <Text style={tw`text-primary font-bold text-base`}>
            {selectedTypeObject.label}
          </Text>
        </View>
      </View>
    );
  }, [selectedTypeObject]);

  return (
    <View style={tw`mb-5`}>
      {dataTypes.length > 0 && (
        <>
          {selectedTypeHeader}
          <View style={tw`h-[50px] justify-center`}>
            {dataTypeTabs}
          </View>
        </>
      )}
      
      {allTypesModal}
    </View>
  );
};

export default React.memo(DataTypesSelection); 
