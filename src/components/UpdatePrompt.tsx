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

  const handleDismiss = () => {
    if (!updateInfo) return;
    onDismiss(updateInfo.latestVersion);
  };

  const handleUpdate = () => {
    if (!updateInfo) return;
    Linking.openURL(updateInfo.updateUrl);
  };

  return (
    <Portal>
      <Dialog
        visible={visible && !!updateInfo}
        onDismiss={updateInfo?.isForced ? undefined : handleDismiss}
        dismissable={!updateInfo?.isForced}>
        <Dialog.Title>Update Available</Dialog.Title>
        <Dialog.Content>
          <Paragraph>
            A new version ({updateInfo?.latestVersion}) of the app is available. Your current version is {currentVersion}.
            {updateInfo?.isForced ? " This update is required to continue using the app." : ""}
          </Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          {!updateInfo?.isForced && (
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
