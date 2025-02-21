import React from "react";
import { Linking } from "react-native";
import { Button, Dialog, Paragraph, Portal } from "react-native-paper";
import tw from "@lib/tailwind";
import * as Application from "expo-application";
import { VersionCheckResponse } from "@store/redux-api/systemSettingsApi";

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
  const currentVersion = Application.nativeBuildVersion || "";

  if (!updateInfo || !visible) {
    return null;
  }

  const { latestVersion, updateUrl, isForced } = updateInfo;

  const handleDismiss = () => {
    onDismiss(latestVersion);
  };

  const handleUpdate = () => {
    Linking.openURL(updateUrl);
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={isForced ? undefined : handleDismiss}
        dismissable={!isForced}>
        <Dialog.Title>Update Available</Dialog.Title>
        <Dialog.Content>
          <Paragraph>
            A new version ({latestVersion}) of the app is available. Your current version is {currentVersion}.
            {isForced ? " This update is required to continue using the app." : ""}
          </Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          {!isForced && (
            <Button onPress={handleDismiss} style={tw`mr-2`}>
              Later
            </Button>
          )}
          <Button mode="contained" onPress={handleUpdate}>
            Update Now
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default UpdatePrompt;
