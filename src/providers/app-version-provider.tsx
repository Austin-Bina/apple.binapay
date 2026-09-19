import React, { Fragment, useEffect, useState, createContext, useContext } from "react";
import { useCheckAppVersionQuery } from "@store/redux-api/systemSettingsApi";
import UpdatePrompt from "@components/UpdatePrompt";
import * as Application from "expo-application";
import AsyncStorage from "@react-native-async-storage/async-storage";

const VERSION_CHECK_STORAGE_KEY = "app_version_check";
const VERSION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

interface VersionStorage {
  lastChecked: number;
  skippedVersion: string | null;
}

interface AppVersionContextType {
  checkForUpdates: () => void;
  isCheckingForUpdates: boolean;
  currentVersion: string;
  buildNumber: string;
}

const AppVersionContext = createContext<AppVersionContextType>({
  checkForUpdates: () => {},
  isCheckingForUpdates: false,
  currentVersion: "",
  buildNumber: "",
});

export const useAppVersion = () => useContext(AppVersionContext);

export const AppVersionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [skippedVersion, setSkippedVersion] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [shouldQuery, setShouldQuery] = useState(false);

  const currentVersion = Application.nativeApplicationVersion || "1.0.0";
  const buildNumber = Application.nativeBuildVersion || "";

  const { data: updateInfo, isFetching, refetch } = useCheckAppVersionQuery(undefined, {
    skip: !shouldQuery,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(VERSION_CHECK_STORAGE_KEY);
        let lastChecked = 0;

        if (stored) {
          const parsed: VersionStorage = JSON.parse(stored);
          setSkippedVersion(parsed.skippedVersion);
          lastChecked = parsed.lastChecked;
        }

        // Only decide whether to query once we actually know lastChecked —
        // never before storage has resolved, which is what broke the throttle.
        setShouldQuery(Date.now() - lastChecked > VERSION_CHECK_INTERVAL);
      } catch (error) {
        console.error("Failed to load version check data:", error);
        setShouldQuery(true); // fail open — check rather than silently skip forever
      } finally {
        setStorageLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!updateInfo?.updateAvailable) return;

    if (updateInfo.isForced || String(updateInfo.latestVersion) !== skippedVersion) {
      setShowUpdatePrompt(true);
    }
  }, [updateInfo, skippedVersion]);

  useEffect(() => {
    if (!storageLoaded || !updateInfo) return;
    persistCheckTime(skippedVersion);
  }, [storageLoaded, updateInfo]);

  const persistCheckTime = async (skippedVer: string | null) => {
    try {
      const data: VersionStorage = { lastChecked: Date.now(), skippedVersion: skippedVer };
      await AsyncStorage.setItem(VERSION_CHECK_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save version check data:", error);
    }
  };

  const handleDismiss = (version: string) => {
    setSkippedVersion(version);
    setShowUpdatePrompt(false);
    persistCheckTime(version);
  };

  const checkForUpdates = () => {
    setShouldQuery(true);
    refetch();
  };

  const contextValue: AppVersionContextType = {
    checkForUpdates,
    isCheckingForUpdates: isFetching,
    currentVersion,
    buildNumber,
  };

  return (
    <AppVersionContext.Provider value={contextValue}>
      <Fragment>
        {children}
        <UpdatePrompt
          visible={showUpdatePrompt}
          updateInfo={updateInfo}
          onDismiss={handleDismiss}
        />
      </Fragment>
    </AppVersionContext.Provider>
  );
};
