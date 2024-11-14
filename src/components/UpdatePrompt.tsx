import React from "react";
import { Linking } from "react-native";
import { Button, Dialog, Paragraph, Portal } from "react-native-paper";
import tw from "@lib/tailwind";
import * as Application from "expo-application";
import { systemSettingsApi, useCheckAppVersionQuery } from "@store/redux-api/systemSettingsApi";
import { useTypedDispatch } from "@store/common";
import { defaultVersionCheckResponse } from "@helpers/notification";

const UpdatePrompt: React.FC = () => {
  const { data: updateInfo } = useCheckAppVersionQuery();
  const dispatch = useTypedDispatch();
  
  const { latestVersion, updateUrl, isForced, updateAvailable } = updateInfo || defaultVersionCheckResponse;
  
  const dismissAppUpdateModal = () => {
    dispatch(
      systemSettingsApi.util.updateQueryData("checkAppVersion", undefined, (draft) => {
        if (draft) {
          draft.updateAvailable = false;
        }
      }),
    );
  };
  
  const currentVersion = Application.nativeBuildVersion || "";
  
  const handleUpdate = () => {
    Linking.openURL(updateUrl);
  };

  return (
    <Portal>
      <Dialog visible={updateAvailable} onDismiss={isForced ? undefined : dismissAppUpdateModal} dismissable={!isForced}>
        <Dialog.Title>Update Available</Dialog.Title>
        <Dialog.Content>
          <Paragraph>
            A new version of the app is available. Your current version is {currentVersion}, and the latest version is{" "}
            {latestVersion}.
          </Paragraph>
          <Paragraph style={tw`mt-2`}>
            {isForced ? "This update is required to continue using the app." : "Would you like to update now?"}
          </Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          {!isForced && <Button onPress={dismissAppUpdateModal}>Later</Button>}
          <Button mode="contained" onPress={handleUpdate}>
            Update Now
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default UpdatePrompt;
