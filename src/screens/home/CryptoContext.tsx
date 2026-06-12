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
  price_change_24h?: number | null;
  price_history_24h?: number[];
  balance?: number;
  decimal_places?: number;
};

type CryptoContextType = {
  assets: CryptoAsset[];
  totalUsd: number;  
  refresh: () => void;
};

const CryptoContext = createContext<CryptoContextType>({
  assets: [],

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
          price_change_24h:  priceAsset?.price_change_24h ?? null, 
          price_history_24h: priceAsset?.price_history_24h ?? [],
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
   
    fetchPrices();
  };

  useEffect(() => {
    // Display Redux assets immediately, then fetch API updates
    fetchPrices();
    const interval = setInterval(fetchPrices, 90000); // Refresh every 90s
    return () => clearInterval(interval);
  }, [reduxAssets, user]);



  return (
    <CryptoContext.Provider value={{ assets,  totalUsd, refresh }}>
      {children}
    </CryptoContext.Provider>
  );
};


