import { route } from "@helpers/route";
import API from "@lib/api";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";

const client = new Ably.Realtime({
  authCallback: async (tokenParams, callback) => {
    let tokenRequest: Ably.TokenRequest;

    try {
      const response = await API.get(route("auth.getAblyToken"), {
        params: tokenParams,
      });
      const { token } = response.data;

      tokenRequest = token;
    } catch (err: any) {
      callback(err, null);
      return;
    }

    callback(null, tokenRequest);
  },
  authParams: { client: "mobile" },
});

type Props = {
  children: React.ReactNode;
};

export default function AblyProviderWrapper({ children }: Props) {
  const user = useTypedSelector(selectUser);

  if(!user) {
    return children;
  }

  return (
    <AblyProvider client={client}>
      <ChannelProvider
        channelName={`private:user-updates.${user.id}`}
        options={{
          params: {
            rewind: "1",
          },
        }}>
        {children}
      </ChannelProvider>
    </AblyProvider>
  );
}
