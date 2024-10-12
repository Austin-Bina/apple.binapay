import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import * as Contacts from "expo-contacts";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import Fuse from "fuse.js";
import { formatPhone } from "@utils/phone";
import BottomSheet from "./BottomSheet/BottomSheet";
import tw from "@lib/tailwind";
import { ActivityIndicator, Searchbar, Text, TextInput } from "react-native-paper";
import { showToast } from "@helpers/toast";
import Toast from "react-native-root-toast";
import ScrollableView from "../shared/ScrollableView";
import { match } from "ts-pattern";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import CustomTextInput from "../form/TextInput";
import { debounce } from "@utils/index";

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onSelectContact: (phoneNumber: string) => void;
  index: number;
};

const PAGE_SIZE = 100;

const ContactPickerModal = ({ index, isVisible, onClose, onSelectContact }: Props) => {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contacts.Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contacts.Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [pageOffset, setPageOffset] = useState(0);

  const bottomSheetRef = useRef<BottomSheetModalMethods>(null);

  const snapPoints = useMemo(() => ["60%", "90%"], []);

  const loadContacts = async (loadMore = false) => {
    if (loading) return;

    setLoading(true);

    const { status } = await Contacts.requestPermissionsAsync();

    if (status !== "granted") {
      return showToast({
        message: "Please grant contacts permission to use this feature.",
        position: Toast.positions.TOP,
      });
    }

    try {
      const { data, hasNextPage: hasMore } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        pageSize: PAGE_SIZE,
        pageOffset: loadMore ? pageOffset : 0,
      });

      if (loadMore) {
        setContacts((prevContacts) => [...prevContacts, ...data]);
        setFilteredContacts((prevContacts) => [...prevContacts, ...data]); // Append to the filtered list for search

        setPageOffset((prevOffset) => prevOffset + PAGE_SIZE);
      } else {
        setContacts(data);
        setAllContacts(data);
        setFilteredContacts(data);

        setPageOffset(PAGE_SIZE);
      }

      setHasNextPage(hasMore);
    } catch (error) {
      console.error("Error loading contacts", error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial contacts on component mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadMoreContacts = () => {
    if (hasNextPage) {
      loadContacts(true);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadContacts();
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  // Debounced search to reduce flickering
  const handleSearch = useMemo(
    () => (query: string) => {
      setSearchQuery(query);

      if (query) {
        const fuse = new Fuse(allContacts, {
          keys: ["name", "phoneNumbers.number"],
          threshold: 0.4,
        });

        const result = fuse.search(query);

        setFilteredContacts(result.map((item) => item.item));
      } else {
        setFilteredContacts(allContacts); // Search the full list of contacts, not just filtered
      }
    },
    [allContacts, pageOffset],
  );

  const handleContactSelect = (contact: Contacts.Contact) => {
    const phoneNumber = contact.phoneNumbers?.[0].number || "";
    const formatted = formatPhone(phoneNumber, "NG");

    onSelectContact(formatted);
    bottomSheetRef.current?.close();
    onClose();
  };

  return (
    <BottomSheet
      scrollable={false}
      index={index}
      ref={bottomSheetRef}
      initialSnapPoints={snapPoints}
      enablePanDownToClose={false}
      onDismiss={onClose}>
      <View style={tw`px-4 flex-1`}>
        <CustomTextInput placeholder="Search Contacts" value={searchQuery} onChangeText={handleSearch} />
        <BottomSheetFlatList
          data={searchQuery ? filteredContacts : contacts}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={tw`p-2 border-b border-gray-300`}
              onPress={() => {
                handleContactSelect(item);
              }}>
              <Text style={tw`text-lg`}>{item.name}</Text>
              {item.phoneNumbers && <Text style={tw`text-gray-500`}>{item.phoneNumbers[0]?.number}</Text>}
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => <Text style={tw`text-center text-gray-500`}>No Contacts Found</Text>}
          onEndReached={loadMoreContacts}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </BottomSheet>
  );
};

export default ContactPickerModal;
