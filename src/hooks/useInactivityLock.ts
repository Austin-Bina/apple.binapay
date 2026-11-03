import { useEffect, useRef, useState, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKGROUNDED_AT_KEY = "APP_BACKGROUNDED_AT";
const INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000;

export function useInactivityLock() {
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);

  const checkElapsed = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(BACKGROUNDED_AT_KEY);
      if (!stored) return;

      const elapsed = Date.now() - parseInt(stored, 10);
      if (elapsed >= INACTIVITY_THRESHOLD_MS) setIsLocked(true);
    } catch {
      // fail open — don't lock the user out over a storage read error
    }
  }, []);

  useEffect(() => {
    checkElapsed(); // cold start: app may have been fully killed while backgrounded

    const subscription = AppState.addEventListener("change", async (nextState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextState === "background") {
        await AsyncStorage.setItem(BACKGROUNDED_AT_KEY, String(Date.now()));
      }
      if (appState.current === "background" && nextState === "active") {
        await checkElapsed();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [checkElapsed]);

  const unlock = useCallback(async () => {
    await AsyncStorage.removeItem(BACKGROUNDED_AT_KEY);
    setIsLocked(false);
  }, []);

  return { isLocked, unlock };
}
