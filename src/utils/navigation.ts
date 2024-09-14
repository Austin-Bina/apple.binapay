import { createNavigationContainerRef } from "@react-navigation/native";
import { setInterval } from "./setTimeout";
import { StackParamList } from "@navigators/types";

export const navigationRef = createNavigationContainerRef<StackParamList>();

export async function getNavigate() {
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

export function getCurrentRouteName() {
  return navigationRef.current?.getCurrentRoute()?.name;
}
