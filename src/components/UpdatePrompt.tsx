import React from "react";
import { Linking, View, StyleSheet } from "react-native";
import { Button, Portal, Modal, Text } from "react-native-paper";
import tw from "@lib/tailwind";
import { VersionCheckResponse } from "@store/redux-api/systemSettingsApi";
import { Gift } from "lucide-react-native";

interface UpdatePromptProps {
  visible: boolean;
  updateInfo: VersionCheckResponse | undefined;
  onDismiss: (version: string) => void;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({ 
  visible, 
  updateInfo, 
  onDismiss 
}) => {

  const handleDismiss = () => {
    if (!updateInfo) return;
    onDismiss(updateInfo.latestVersion);
  };

  const handleUpdate = () => {
    if (!updateInfo) return;
    Linking.openURL(updateInfo.updateUrl);
  };

  if (!updateInfo) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={updateInfo.isForced ? undefined : handleDismiss}
        dismissable={!updateInfo.isForced}
        contentContainerStyle={styles.containerStyle}>
        <View style={tw`items-center`}>
          <View style={tw`justify-center h-20 w-20 items-center p-4 bg-blue-50 rounded-full mb-4`}>
            <Gift size={40} color={tw.color("blue-600")} />
          </View>
          
          <Text style={tw`text-2xl font-bold text-gray-800 text-center mb-1`}>
            New Update Available!
          </Text>
          
          <Text style={tw`text-gray-500 text-base text-center mb-6`}>
            A new version of the app is available. Update to get the latest features and improvements.
          </Text>
          
          {updateInfo.isForced ? (
            <Text style={tw`text-red-500 font-semibold text-center mb-4`}>
              This update is required to continue using the app.
            </Text>
          ) : (
            <Text style={tw`text-gray-600 text-center mb-4`}>
              We recommend keeping your app up to date for the best experience.
            </Text>
          )}
          
          <View style={tw`w-full flex-row justify-between pt-2`}>
            {!updateInfo.isForced && (
              <Button 
                mode="outlined" 
                onPress={handleDismiss}
                style={tw`mr-2 flex-1 border border-gray-300`}
                labelStyle={tw`text-gray-700`}
                contentStyle={tw`py-1.5`}>
                Later
              </Button>
            )}
            <Button 
              mode="contained" 
              onPress={handleUpdate}
              style={[
                tw`flex-1 bg-primary-600`, 
                updateInfo.isForced ? tw`w-full` : {}
              ]}
              labelStyle={tw`text-white font-semibold`}
              contentStyle={tw`py-1.5`}>
              Update Now
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
  },
  iconStyle: {
    width: 40,
    height: 40,
  }
});

export default UpdatePrompt;
