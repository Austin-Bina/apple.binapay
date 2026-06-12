import * as Notifications from "expo-notifications";
import React, { PropsWithChildren, useEffect } from "react";
import { navigate } from "@utils/navigation";
import { SCREENS } from "@constants/screens";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PushNotificationManager: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("🔔 Notification received:", notification);
      }
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("📲 Notification tapped:", response);
        const data = response.notification.request.content.data as Record<string, any>;

        if (data?.type === "p2p_order" && data?.orderId) {
          navigate(SCREENS.P2P_MANAGER_STACK, {
            screen: SCREENS.P2P_ORDER_DETAIL,
            params: { orderId: data.orderId },
          });
        }
      }
    );

    // Handle tap when app was killed
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<string, any>;

      if (data?.type === "p2p_order" && data?.orderId) {
        navigate(SCREENS.P2P_MANAGER_STACK, {
          screen: SCREENS.P2P_ORDER_DETAIL,
          params: { orderId: data.orderId },
        });
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return <>{children}</>;
};

export default PushNotificationManager;
