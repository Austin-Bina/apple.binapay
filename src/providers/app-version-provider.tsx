import React, { Fragment, useEffect, useState } from "react";
import { useCheckAppVersionQuery } from "@store/redux-api/systemSettingsApi";
import UpdatePrompt from "@components/UpdatePrompt";

export const AppVersionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [skipped, setSkipped] = useState(false);

  useCheckAppVersionQuery(undefined, {
    pollingInterval: 300000,
    refetchOnReconnect: true,
    skipPollingIfUnfocused: true,
    skip: skipped,
  });

  const handleDismiss = () => {
    setSkipped(true);
  };

  return (
    <Fragment>
      {children}
      <UpdatePrompt onDismiss={handleDismiss} />
    </Fragment>
  );
};
