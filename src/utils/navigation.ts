import { createNavigationContainerRef } from "@react-navigation/native";
import { setInterval } from "./setTimeout";
import { StackParamList } from "@navigators/types";

const navigationRef = createNavigationContainerRef<StackParamList>();

async function getNavigate() {
  await new Promise<void>((resolve) => {
    const poll = (): boolean => {
      if (navigationRef.isReady()) {
        clearInterval(intervalId);
        resolve();
        return false;
      }
      return true;
    };

    let intervalId: number | undefined;
    if (poll()) {
      intervalId = setInterval(poll, 500);
    }
  });

  return navigationRef;
}

function getCurrentRouteName() {
  return navigationRef.current?.getCurrentRoute()?.name;
}

function resetNavigationToDashboard() {
  navigationRef.current?.reset({
    routes: [
      {
        name: "Home",
        params: {
          screen: "Dashboard",
        },
      },
    ],
  });
}

export { navigationRef, getNavigate, getCurrentRouteName, resetNavigationToDashboard };
