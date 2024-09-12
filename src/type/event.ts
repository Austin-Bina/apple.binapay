import { User } from "./user";

export type RefreshFlags = {
  transactions?: boolean;
  settings?: boolean;
};

export type AccountUpdateEventPayload = {
  payload: {
    activity: string;
    account?: {
      user: User;
    };
    refreshFlags?: RefreshFlags;
  };
};
