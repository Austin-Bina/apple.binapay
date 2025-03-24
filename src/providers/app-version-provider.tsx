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

export const AppVersionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [skippedVersion, setSkippedVersion] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number>(0);
  const [forceCheck, setForceCheck] = useState(false);
  
  const currentVersion = Application.nativeApplicationVersion || "1.0.0";
  const buildNumber = Application.nativeBuildVersion || "";

  const { data: updateInfo, isFetching } = useCheckAppVersionQuery(undefined, {
    skip: !shouldCheckForUpdates(lastChecked) && !forceCheck,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    const loadVersionCheckData = async () => {
      try {
        const storedData = await AsyncStorage.getItem(VERSION_CHECK_STORAGE_KEY);
        if (storedData) {
          const parsedData: VersionStorage = JSON.parse(storedData);
          setSkippedVersion(parsedData.skippedVersion);
          setLastChecked(parsedData.lastChecked);
        }
      } catch (error) {
        console.error("Failed to load version check data:", error);
      }
    };

    loadVersionCheckData();
  }, []);

  useEffect(() => {
    if (!updateInfo) return;
    
    if (updateInfo.updateAvailable) {
      if (updateInfo.isForced || updateInfo.latestVersion !== skippedVersion) {
        setShowUpdatePrompt(true);
      }
    }
    
    saveVersionCheckData(skippedVersion);
    
    if (forceCheck) {
      setForceCheck(false);
    }
  }, [updateInfo, skippedVersion]);

  const checkForUpdates = () => {
    setForceCheck(true);
    saveVersionCheckData(null);
  };

  const handleDismiss = (version: string) => {
    setSkippedVersion(version);
    setShowUpdatePrompt(false);
    saveVersionCheckData(version);
  };

  const saveVersionCheckData = async (skippedVer: string | null) => {
    try {
      const now = Date.now();
      setLastChecked(now);
      
      const data: VersionStorage = {
        lastChecked: now,
        skippedVersion: skippedVer
      };
      
      await AsyncStorage.setItem(VERSION_CHECK_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save version check data:", error);
    }
  };
  
  function shouldCheckForUpdates(lastCheckedTime: number): boolean {
    const now = Date.now();
    return now - lastCheckedTime > VERSION_CHECK_INTERVAL;
  }

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
