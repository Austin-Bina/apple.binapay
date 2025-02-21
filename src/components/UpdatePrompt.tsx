import React from "react";
import { Linking } from "react-native";
import { Button, Dialog, Paragraph, Portal } from "react-native-paper";
import tw from "@lib/tailwind";
import * as Application from "expo-application";
import { systemSettingsApi, useCheckAppVersionQuery } from "@store/redux-api/systemSettingsApi";
import { useTypedDispatch } from "@store/common";
import { defaultVersionCheckResponse } from "@helpers/notification";

interface UpdatePromptProps {
  onDismiss: () => void;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({ onDismiss }) => {
  const dispatch = useTypedDispatch();
  const currentVersion = Application.nativeBuildVersion || "";

  const { data: updateInfo } = useCheckAppVersionQuery(undefined);
  const { latestVersion, updateUrl, isForced, updateAvailable } = updateInfo || defaultVersionCheckResponse;

  const dismissAppUpdateModal = () => {
    dispatch(
      systemSettingsApi.util.updateQueryData("checkAppVersion", undefined, (draft) => {
        if (draft) {
          draft.updateAvailable = false;
        }
      })
    );
    onDismiss();
  };

  const handleUpdate = () => {
    Linking.openURL(updateUrl);
  };

  return (
    <Portal>
      <Dialog
        visible={updateAvailable}
        onDismiss={isForced ? undefined : dismissAppUpdateModal}
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
            <Button onPress={dismissAppUpdateModal} style={tw`mr-2`}>
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
