// CryptoContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import API from "@lib/api";
import { routes } from "@constants/routes";
import { useSelector } from "react-redux";
import { State } from "@store/main";
import { selectCryptoAssets, selectUser } from "@store/selectors/auth";

type Wallet = { name: string; balance: number; slug: string; decimal_places?: number };
type CryptoAsset = {
  id: number;
  name: string;
  symbol: string;
  icon_url?: string;
  price_usd?: number;
  balance?: number;
  decimal_places?: number;
};

type CryptoContextType = {
  assets: CryptoAsset[];
  loading: boolean;
  totalUsd: number;  
  refresh: () => void;
};

const CryptoContext = createContext<CryptoContextType>({
  assets: [],
  loading: true,
  totalUsd: 0,
  refresh: () => {},
});

export const useCrypto = () => useContext(CryptoContext);

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useSelector((state: State) => selectUser(state));
  const reduxAssets = useSelector((state: State) => selectCryptoAssets(state));
  const [assets, setAssets] = useState<CryptoAsset[]>(reduxAssets || []);
  const [loading, setLoading] = useState(!reduxAssets?.length);
    const [totalUsd, setTotalUsd] = useState(0);
    
  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

/**
 * fetch totalcryptousd
 */
const fetchTotalUsd = async () => {
  try {
    const response = await API.get(routes.api.v1.auth.totalcryptousd);

    console.log("fetchTotalUsd response:", response.data);

    if (response.data.success) {
      // ⚡ Use the correct field name
      setTotalUsd(response.data.totalCryptoUsd);
      console.log("Total USD fetched:", response.data.totalCryptoUsd);
    } else {
      console.warn("fetchTotalUsd returned success=false");
    }
  } catch (err) {
    console.error("Error fetching total crypto USD:", err);
  }
};



  /**
   * 
   * @returns fetchprices and assets
   */
  const fetchPrices = async () => {
    try {
      if (!BASE_URL) return;

      // Fetch latest prices from API
      const res = await API.get<{ success: boolean; data: CryptoAsset[] }>(
        routes.api.v1.services.cryptoAssets
      );
      if (!res.data.success) throw new Error("Failed to fetch crypto prices");

      const pricesMap: Record<string, CryptoAsset> = {};
      res.data.data.forEach((a) => {
        pricesMap[a.symbol.toLowerCase()] = a;
      });

      // Merge Redux assets with latest prices
      const merged = (reduxAssets || []).map((asset) => {
        const priceAsset = pricesMap[asset.symbol.toLowerCase()];
        const wallet = user?.wallet_balances?.[asset.symbol.toLowerCase()];

        const icon_url =
          priceAsset?.icon_url?.startsWith("http")
            ? priceAsset.icon_url
            : priceAsset?.icon_url
            ? `${BASE_URL}/storage/app/public/crypto-icons/${priceAsset.icon_url}`
            : asset.icon_url;

        return {
          ...asset,
          price_usd: priceAsset?.price_usd ?? asset.price_usd,
          icon_url,
          balance: wallet ? Number(wallet.balance) : asset.balance ?? 0,
          decimal_places: wallet?.decimal_places ?? asset.decimal_places ?? 8,
        };
      });

      // Sort by balance * price
      merged.sort((a, b) => (b.balance * (b.price_usd ?? 0)) - (a.balance * (a.price_usd ?? 0)));
  await fetchTotalUsd();

      setAssets(merged);
    } catch (err) {
      console.error("Error fetching crypto prices:", err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    fetchPrices();
  };

  useEffect(() => {
    // Display Redux assets immediately, then fetch API updates
    fetchPrices();
    const interval = setInterval(fetchPrices, 90000); // Refresh every 90s
    return () => clearInterval(interval);
  }, [reduxAssets, user]);



  return (
    <CryptoContext.Provider value={{ assets, loading, totalUsd, refresh }}>
      {children}
    </CryptoContext.Provider>
  );
};




/**
 * for dashboard
 */
/*

 <ScrollableView
        style={tw`px-3 flex flex-1 py-6`}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}>
        {/* Balance *//*
        <Card mode="contained" style={tw`bg-primary-50 py-2`}>
          <Card.Content style={tw`items-center`}>
            <View style={tw`flex-row justify-center items-center`}>
              <View>

                {balanceVisible ? (
  <View style={tw`flex-row items-baseline justify-center`}>
    {/* Naira Balance */ /*
    <View style={tw`items-center mr-4`}>
      <Text style={tw`text-gray-900 font-bold text-xl`}>
        {formatToNaira(nairaWalletBalance)}
      </Text>
    </View>

    {/* USD Crypto Balance */ /*
    <View style={tw`items-center`}>
      <Text style={tw`text-gray-900 font-bold text-xl`}>
        ${totalCryptoUsd.toFixed(2)}
      </Text>
    </View>
  </View>
) : (
  <HorizontalDots />
)}
              </View>
              <IconButton
                icon={
                  balanceVisible
                    ? (props) => <LargeEyeOpen {...props} width={scale(30)} height={scale(30)} />
                    : (props) => <LargeEyeClose {...props} width={scale(30)} height={scale(30)} />
                }
                onPress={toggleBalance}
              />
            </View>
         {/*}   <Button icon="wallet" mode="outlined" style={tw`border-primary mt-2`} onPress={openFundModal}>
              Fund Wallet
            </Button> */ /*
            <View style={tw`flex-row justify-center items-center gap-4 mt-2`}>
  <Button
    icon="wallet"
    mode="outlined"
    style={tw`border-primary flex-1`}
    onPress={() => setFundModalVisible(true)}
  >
    Fund Wallet
  </Button>

  <Button
    icon="cash-minus"
    mode="outlined"
    style={tw`border-danger flex-1`}
    onPress={() => setWithdrawModalVisible(true)}
  >
    Withdraw
  </Button>
</View>
          </Card.Content>
        </Card>

        {hasProfileError && (
          <Pressable onPress={onRefresh} style={tw`mt-6`}>
            <Banner
              title="Network Error"
              content="We couldn't load some of your account details. Click to try again."
            />
          </Pressable>
        )}

        {!isVerified && (
          <Pressable onPress={handleVerifyAccount} style={tw`mt-6`}>
            <Banner
              title="Account Verification"
              content="You are yet to verify your account, click to complete verification now."
            />
          </Pressable>
        )}

        <View style={tw`my-4`}>
          <Text style={tw`text-base font-medium text-gray-600 mb-3.5`}>Services</Text>
          <View style={tw`flex-row justify-around`}>


            
            <IconButtonWithLabel
              RenderIcon={ZapIcon}
              size={24}
              label="Buy / Sell+Crypto"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "Convert Crypto", //i made changes here 
                  },
                });
              }}
            />          
            <IconButtonWithLabel
              RenderIcon={PhoneIcon}
              size={24}
              label="Airtime+Purchase"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "Airtime Purchase",
                  },
                });
              }}
            />
            <IconButtonWithLabel
              RenderIcon={WifiIcon}
              size={24}
              label="Data+Bundle"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "Data Purchase",
                  },
                });
              }}
            />         
            <IconButtonWithLabel
              RenderIcon={MoreIcon}
              size={24}
              label="Explore+More"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "List",
                  },
                });
              }}
            />
          </View>
        </View>


     {/* Tabs: Crypto Wallets / Transactions   /*
<View style={tw`my-4`}>
  <View style={tw`flex-row border-b border-gray-200`}>
    <TouchableOpacity
      style={tw`flex-1 py-2`}
      onPress={() => setActiveTab("wallets")}
    >
      <Text
        style={tw.style(
          `text-center font-semibold py-1`,
          activeTab === "wallets" ? "text-primary border-b-2 border-primary" : "text-gray-500"
        )}
      >
        Crypto Wallets
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={tw`flex-1 py-2`}
      onPress={() => setActiveTab("transactions")}
    >
      <Text
        style={tw.style(
          `text-center font-semibold py-1`,
          activeTab === "transactions" ? "text-primary border-b-2 border-primary" : "text-gray-500"
        )}
      >
        Transactions
      </Text>
    </TouchableOpacity>
  </View>

  {/* Render whichever tab is active */ /*
  <View style={tw`mt-3`}>
    {activeTab === "wallets" && <CryptoProvider><CryptoOverview /></CryptoProvider>}
    {activeTab === "transactions" && <RecentTransactions navigation={navigation} />}
  </View>
</View>

      </ScrollableView>
*/
