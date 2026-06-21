import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { scale } from "react-native-size-matters";
import { MessageCircle } from "lucide-react-native";
import API from "@lib/api";
import { showToast } from "@helpers/toast";
import { routes } from "@constants/routes";
import ContactSupportModal from "@components/ui/modals/ContactSupportModal";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";


type Contact = {
  whatsapp: string;
  phone: string;
  support_url: string;
};

export default function ContactSupportButton() {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContactSettings = async () => {
      setLoading(true);
      try {
        const response = await API.get(routes.api.v1.support.contact);


        // Normalize response
        const data = response.data?.data || response.data;

              console.log("📝 Normalized contact data:", data);

        if (!data) throw new Error("No contact data");

        setContact({
          whatsapp: data.whatsapp || "",
          phone: data.phone || "",
          support_url: data.support_url || "",
        });
      } catch (error: any) {
        console.error("❌ Failed to load contact settings:", error?.response?.data || error);
        showToast({message: "Unable to fetch support contact info. Please check your internet connection.", variant: "error"});
        setContact(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContactSettings();
  }, []);

  return (
     <View>
       {/* Please wait modal */}
       <PleaseWaitModal visible={loading} />
 
       {/* Floating Button */}
       <TouchableOpacity
         onPress={() => setOpen(true)}
         style={styles.floatingButton}
         disabled={loading}
       >
         <MessageCircle width={24} height={24} color="white" />
       </TouchableOpacity>
 
       {/* Contact Modal */}
       <ContactSupportModal
         show={open}
         hide={() => setOpen(false)}
         contact={contact}
       />
     </View>
   );
 }

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: scale(24),
    right: scale(24),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
