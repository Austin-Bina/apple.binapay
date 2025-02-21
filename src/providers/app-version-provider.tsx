import React, { Fragment, useEffect, useState } from "react";
import { useCheckAppVersionQuery } from "@store/redux-api/systemSettingsApi";
import UpdatePrompt from "@components/UpdatePrompt";

export const AppVersionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [skippedVersion, setSkippedVersion] = useState<string | null>(null);

  const { data: updateInfo } = useCheckAppVersionQuery(undefined, {
    pollingInterval: 300000,
    refetchOnReconnect: true,
    skipPollingIfUnfocused: true,
  });

  const shouldShowPrompt = updateInfo?.updateAvailable && 
    (updateInfo.isForced || updateInfo.latestVersion !== skippedVersion);

  const handleDismiss = (version: string) => {
    setSkippedVersion(version);
  };

  return (
    <Fragment>
      {children}
      <UpdatePrompt 
        visible={Boolean(shouldShowPrompt)}
        updateInfo={updateInfo}
        onDismiss={handleDismiss}
      />
    </Fragment>
  );
};
