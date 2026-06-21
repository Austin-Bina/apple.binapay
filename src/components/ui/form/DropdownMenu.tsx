import tw from "@lib/tailwind";
import React, { useState } from "react";
import { Controller, Control } from "react-hook-form";
import { View, StyleSheet, Dimensions, Platform, TextInput } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { HelperText, Text } from "react-native-paper";
import { ChevronDown, Search, Check } from "lucide-react-native";
import { AvatarImage } from "@components/avatar";

type DataItem = {
  label: string;
  id: string | number;
  image?: any;
};

type Props<T extends DataItem> = {
  control: Control<any>;
  name: string;
  label?: string;
  placeholder?: string;
  search?: boolean;
  data: Array<T>;
  onDataSelect?: (data: T) => void;
};

export default function DropdownMenuField<T extends DataItem>({
  control,
  name,
  data = [],
  placeholder,
  label,
  search = false,
  onDataSelect = () => {},
}: Props<T>) {
  const [isFocus, setIsFocus] = useState(false);
  const { width } = Dimensions.get("window");
  
  // Calculate a responsive dropdown width based on screen size
  const dropdownWidth = width > 680 ? "80%" : "95%";
  const maxHeight = Math.min(350, Dimensions.get("window").height * 0.4);

  return (
    <Controller
      control={control}
      name={name}
      render={({ fieldState: { error }, field: { onChange, value } }) => (
        <View style={tw`w-full`}>
          {label && (
            <Text style={tw`text-gray-600 text-sm font-medium mb-1`}>
              {label}
            </Text>
          )}
          <Dropdown
            data={data}
            labelField="label"
            valueField="id"
            disable={data.length === 0}
            value={value}
            placeholder={!isFocus ? placeholder : "..."}
            searchPlaceholder="Search..."
            onChange={(item) => {
              onChange(item.id);
              onDataSelect(item);
              setIsFocus(false);
            }}
            search={search}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            maxHeight={maxHeight}
            style={[
              styles.dropdown,
              tw.style(
                `bg-white border rounded-lg py-2.5 px-3`,
                error ? "border-red-500" : isFocus ? "border-primary-500" : "border-gray-300"
              ),
            ]}
            placeholderStyle={tw`text-gray-400 text-sm`}
            selectedTextStyle={tw`text-gray-800 text-sm font-medium`}
            inputSearchStyle={tw`h-10 border-gray-300 rounded-md text-sm`}
            iconStyle={tw`w-5 h-5`}
            containerStyle={[
              styles.dropdownContainer, 
              tw`rounded-lg shadow-md border border-gray-200 bg-white`,
              { width: dropdownWidth,  marginTop: 8, }
            ]}
            itemContainerStyle={tw`border-b border-gray-100`}
            itemTextStyle={tw`text-sm text-gray-700 py-1`}
            activeColor={tw.color("primary-50")}
            renderLeftIcon={() => {
              const selectedData = data.find((d) => d.id === value);

              return (
                selectedData &&
                selectedData.image && (
                  <AvatarImage 
                    avatar={selectedData.image} 
                    size={24} 
                    style={tw`rounded-full mr-2`} 
                  />
                )
              );
            }}
            renderRightIcon={(isOpen) => (
              <ChevronDown 
                size={18} 
                color={isFocus ? tw.color("primary-500") : tw.color("gray-500")}
                style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
              />
            )}
            renderInputSearch={(onSearch) => (
              <View style={tw`flex-row items-center border-b border-gray-200 px-2 py-2`}>
                <Search size={16} color={tw.color("gray-500")} style={tw`mr-2`} />
                <View style={tw`flex-1 h-9 justify-center`}>
                  <TextInput
                    style={tw`text-sm text-gray-800`}
                    placeholderTextColor={tw.color("gray-400")}
                    placeholder="Search..."
                    onChangeText={onSearch}
                  />
                </View>
              </View>
            )}
            renderItem={(item, selected) => (
              <View style={tw`flex-row items-center p-3`}>
                {item.image && (
                  <AvatarImage 
                    avatar={item.image} 
                    size={24} 
                    style={tw`rounded-full mr-2`} 
                  />
                )}
                <Text style={tw`flex-1 text-sm text-gray-800`}>{item.label}</Text>
                {selected && <Check size={16} color={tw.color("primary-500")} />}
              </View>
            )}
          />
          {error && (
            <HelperText type="error" style={tw`mt-1 text-xs`}>
              {error.message}
            </HelperText>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  dropdown: {
    width: "100%",
    height: Platform.OS === "ios" ? 44 : 48,
  },
  dropdownContainer: {
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});
