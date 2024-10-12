import tw from "@lib/tailwind";
import React from "react";
import { Controller, Control } from "react-hook-form";
import { View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { HelperText, Text } from "react-native-paper";
import ArrowDown from "@assets/icons/arrow-down.svg";
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
  return (
    <Controller
      control={control}
      name={name}
      render={({ fieldState: { error }, field: { onChange, value } }) => (
        <View>
          <Text style={tw`text-gray text-sm font-light leading-loose`}>{label}</Text>
          <Dropdown
            data={data}
            labelField="label"
            valueField="id"
            disable={data.length === 0}
            value={value}
            placeholder={placeholder}
            searchPlaceholder="Search..."
            onChange={(value) => {
              onChange(value.id);
              onDataSelect(value);
            }}
            search={search}
            renderLeftIcon={() => {
              const selectedData = data.find((d) => d.id === value);

              return (
                selectedData &&
                selectedData.image && (
                  <AvatarImage avatar={selectedData.image} size={30} style={tw`rounded-full border-primary-100`} />
                )
              );
            }}
            renderRightIcon={(isOpen) => (
              <ArrowDown style={[{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }]} width={24} />
            )}
            style={tw.style(
              `w-full bg-white rounded-2xl border py-2 px-4`,
              error ? "border-red-500" : "border-gray-300",
            )}
            placeholderStyle={tw`text-gray-400`}
            iconStyle={tw`w-6 h-6 border-gray-500`}
            selectedTextStyle={tw`text-sm`}
            itemTextStyle={tw`text-sm`}
          />
          <HelperText
            type="error"
            visible={!!error}
            style={{
              height: error ? "auto" : 0,
            }}>
            {error?.message}
          </HelperText>
        </View>
      )}
    />
  );
}
