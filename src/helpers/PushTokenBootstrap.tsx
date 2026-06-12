import { useEffect, useRef } from "react";
import { useTypedSelector } from "@store/common";
import { registerForPushNotifications } from "@helpers/registerForPushNotifications";
import { syncPushToken } from "@helpers/syncPushToken";
import { selectLoggedIn, selectNewUser } from "@store/selectors/auth";

export default function PushTokenBootstrap() {
  const isLoggedIn = useTypedSelector(selectLoggedIn);
  const isNewUser = useTypedSelector(selectNewUser);
  const hasSyncedRef = useRef(false);

  const isAuthenticated = isLoggedIn && !isNewUser;

  useEffect(() => {
    if (!isAuthenticated || hasSyncedRef.current) return;

    (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await syncPushToken(token);
        hasSyncedRef.current = true; // ✅ prevent duplicate sync
      }
    })();
  }, [isAuthenticated]);

  return null;
}
