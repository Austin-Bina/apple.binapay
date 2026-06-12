import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { routes } from "@constants/routes";
import { route } from "@helpers/route";


// ── Types ─────────────────────────────────────────────────────────────────────

export type P2POrder = {
  id: string;
  type: "Buy" | "Sell";
  amount: string;
  quantity: string;
  coin: string;
  currency: string;
  price: string;
  status: "unpaid" | "paid" | "appealing" | "completed" | "cancelled" | "unknown";
  buyer_name: string | null;
  seller_name: string | null;
  created_at: string | null;
  needs_attention?: boolean;
   unread_messages?: number;
};

export type P2POrderDetail = P2POrder & {
  order_no: string | null;
  payment_method: string | null;
  account_number: string | null;
  account_name: string | null;
  bank_name: string | null;
  bank_code: string | null;
  is_verified: boolean;
  minus_fee: boolean | null;
  transfer_last_seconds: number | null;
};

export type P2PConnectionStatus = {
  connected: boolean;
  exchange: string | null;
  connected_at: string | null;
};

type ConnectPayload = {
  exchange: string;
  api_key: string;
  api_secret: string;
};

type ConnectResponse = {
  message: string;
  exchange: string;
  connected_at: string;
};

type OrdersResponse = {
  orders: P2POrder[];
  total: number;
};

type OrderDetailResponse = {
  order: P2POrderDetail;
};

type OrdersParams = {
  status?: "unpaid" | "paid" | "all";
};

export type P2PMessage = {
  id: string | null;
  message: string | null;
  role: string | null;
  user_id: string | null;    
  account_id: string | null; 
  created_at: string | null;
};

type MessagesResponse = {
  messages: P2PMessage[];
  my_bybit_uid: string | null;
};

type SendMessagePayload = {
  orderId: string;
  message: string;
};

// ── Add these types ───────────────────────────────────────────────────────────

export type P2PPaymentMethod = {
  id: string;
  payment_type: number;
  payment_name: string;
  account_no: string;
  bank_name: string;
  real_name: string;
  label: string;
};

export type P2PAd = {
  id: string;
  side: 'Buy' | 'Sell';
  price: string;
  quantity: string;
  min_amount: string;
  max_amount: string;
  payment_period: string | null;
  status: number | null;
  is_online?: boolean;
  remark: string | null;
  payment_ids: string[];
  token: string;
  currency: string;
  trading_enabled?: boolean;
  trading_pref_kyc?: boolean;
  trading_pref_min_orders?: number;
  trading_pref_no_unposted_ad?: boolean;
  
};

type AdsResponse = {
  ads: P2PAd[];
};

type PaymentMethodsResponse = {
  payment_methods: P2PPaymentMethod[];
};

type BalanceResponse = {
  usdt_balance: number;
};

type UpdateAdPayload = {
  adId: string;
  price: number;
  min_amount: number;
  max_amount: number;
  quantity: number;
  payment_ids: string[];
  remark?: string;
   payment_period?: string;
  trading_pref_kyc?: boolean;
  trading_pref_min_orders?: number;
  trading_pref_no_unposted_ad?: boolean;
};

export type P2PUserSettings = {
  auto_payment_enabled: boolean;
  auto_release_enabled: boolean;
  fee_enabled: boolean;
  fee_amount: string | null;
  min_fee_amount: string | null;
  fee_mode: "auto" | "require_word";
  name_match_count: number;
  amount_buffer_lower: number;
  amount_buffer_upper: number;
  notify_new_orders: boolean;
  valid_replies: string[];
  msg_status_10_buy: string | null;
  msg_status_10_sell: string | null;
  msg_status_20_buy: string | null;
  msg_status_20_sell: string | null;
  auto_update_ads_enabled: boolean;
  ads_update_interval_minutes: number;
  nth_ad: number;
  min_buy_amount: number;
  min_sell_amount: number;
  min_margin: number;
  skip_bad_counterparties: boolean;
  msg_status_10_followup: string | null;
  followup_delay_minutes: number;
  updated_at: string | null;
};


export type P2PInsightsData = {
  period: string;
  date_range: string;
  net_volume: number;
  buy_volume: number;
  sell_volume: number;
  total_orders: number;
  buy_orders: { success: number; pending: number; cancelled: number };
  sell_orders: { success: number; pending: number; cancelled: number };
  chart: {
    labels: string[];
    buy: number[];
    sell: number[];
  };
};

export type P2PRatesPreview = {
  buy_rate:   number | null;
  sell_rate:  number | null;
  margin:     number | null;
  margin_ok:  boolean;
  min_margin: number;
  nth_ad:     number;
  ads_update_interval_minutes: number;
  buy_ad:  { price: string; quantity: string; nickname: string } | null;
  sell_ad: { price: string; quantity: string; nickname: string } | null;
};

type InsightsResponse = P2PInsightsData;
type InsightsParams = { period: 'today' | 'week' | 'month' };
type UserSettingsResponse = {
  settings: P2PUserSettings;
};

export type P2PWhitelistIpsResponse = {
  whitelist_ips: string[];
  tutorial_url: string | null;
};

type UpdateSettingsPayload = Partial<Omit<P2PUserSettings, "updated_at">>;

// ── API ───────────────────────────────────────────────────────────────────────

export const p2pApi = createApi({
  reducerPath: "p2pApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["P2PStatus", "P2POrders", "P2POrderDetail", "P2PUserSettings", "P2PAds", "P2PPaymentMethods"],
  endpoints: (builder) => ({


    getP2PWhitelistIps: builder.query<P2PWhitelistIpsResponse, void>({
    query: () => ({
    url: "/api/v1/p2p/whitelist-ips",
    method: "GET",
        }),
    keepUnusedDataFor: 3600, // cache 1 hour — IPs rarely change
         }),
    
    // Check connection status
    getP2PStatus: builder.query<P2PConnectionStatus, void>({
      query: () => ({
        url: "/api/v1/p2p/status",
        method: "GET",
      }),
      providesTags: ["P2PStatus"],
    }),

    // Connect exchange
    connectP2P: builder.mutation<ConnectResponse, ConnectPayload>({
      query: (body) => ({
         url: "/api/v1/p2p/connect",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["P2PStatus", "P2POrders"],
    }),

    // Disconnect exchange
    disconnectP2P: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/api/v1/p2p/disconnect",
        method: "DELETE",
      }),
      invalidatesTags: ["P2PStatus", "P2POrders"],
    }),

    // Fetch orders
    getP2POrders: builder.query<OrdersResponse, OrdersParams>({
      query: (params) => ({
        url: "/api/v1/p2p/orders",
        method: "GET",
        params,
      }),
      providesTags: ["P2POrders"],
      keepUnusedDataFor: 0, 
    }),

    // Fetch single order detail
    getP2POrderDetail: builder.query<OrderDetailResponse, string>({
      query: (orderId) => ({
        url: `/api/v1/p2p/orders/${orderId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, orderId) => [
        { type: "P2POrderDetail", id: orderId },
      ],
    }),

    // Fetch order messages
getP2POrderMessages: builder.query<MessagesResponse, string>({
  query: (orderId) => ({
    url: `/api/v1/p2p/orders/${orderId}/messages`,
    method: "GET",
  }),
  providesTags: (_result, _error, orderId) => [
    { type: "P2POrderDetail", id: `${orderId}-messages` },
  ],
}),

// Send a message
sendP2PMessage: builder.mutation<{ message: string }, SendMessagePayload>({
  query: ({ orderId, message }) => ({
    url: `/api/v1/p2p/orders/${orderId}/messages`,
    method: "POST",
    data: { message },
  }),
  invalidatesTags: (_result, _error, { orderId }) => [
    { type: "P2POrderDetail", id: `${orderId}-messages` },
  ],
}),

// Get user P2P settings
getUserP2PSettings: builder.query<UserSettingsResponse, void>({
  query: () => ({
    url: "/api/v1/p2p/settings",
    method: "GET",
  }),
  providesTags: ["P2PUserSettings"],
}),

// Update user P2P settings
updateUserP2PSettings: builder.mutation<UserSettingsResponse, UpdateSettingsPayload>({
  query: (body) => ({
    url: "/api/v1/p2p/settings",
    method: "PUT",
    data: body,
  }),
  invalidatesTags: ["P2PUserSettings"],
}),

markOrderAsPaid: builder.mutation<{ message: string }, string>({
  query: (orderId) => ({
    url: `/api/v1/p2p/orders/${orderId}/mark-paid`,
    method: 'POST',
  }),
  invalidatesTags: (_result, _error, orderId) => [
    { type: 'P2POrders' },
    { type: 'P2POrderDetail', id: orderId },
  ],
}),

releaseOrder: builder.mutation<{ message: string }, string>({
  query: (orderId) => ({
    url: `/api/v1/p2p/orders/${orderId}/release`,
    method: 'POST',
  }),
  invalidatesTags: (_result, _error, orderId) => [
    { type: 'P2POrders' },
    { type: 'P2POrderDetail', id: orderId },
  ],
}),

// Fetch ads
getP2PAds: builder.query<AdsResponse, void>({
  query: () => ({
    url: '/api/v1/p2p/ads',
    method: 'GET',
  }),
  providesTags: ['P2PAds'],
}),

// Update ad
updateP2PAd: builder.mutation<{ message: string }, UpdateAdPayload>({
  query: ({ adId, ...body }) => ({
    url: `/api/v1/p2p/ads/${adId}`,
    method: 'PUT',
    data: body,
  }),
  // ── Optimistic update: patch the cache immediately ──────────────────────
  async onQueryStarted({ adId, ...patch }, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      p2pApi.util.updateQueryData('getP2PAds', undefined, (draft) => {
        const ad = draft.ads.find((a) => a.id === adId);
        if (!ad) return;
        if (patch.price        !== undefined) ad.price        = String(patch.price);
        if (patch.quantity     !== undefined) ad.quantity     = String(patch.quantity);
        if (patch.min_amount   !== undefined) ad.min_amount   = String(patch.min_amount);
        if (patch.max_amount   !== undefined) ad.max_amount   = String(patch.max_amount);
        if (patch.remark       !== undefined) ad.remark       = patch.remark ?? null;
        if (patch.payment_period !== undefined) ad.payment_period = patch.payment_period ?? null;
        if (patch.payment_ids  !== undefined) ad.payment_ids  = patch.payment_ids;
        if (patch.trading_pref_kyc            !== undefined) ad.trading_pref_kyc            = patch.trading_pref_kyc;
        if (patch.trading_pref_min_orders     !== undefined) ad.trading_pref_min_orders     = patch.trading_pref_min_orders;
        if (patch.trading_pref_no_unposted_ad !== undefined) ad.trading_pref_no_unposted_ad = patch.trading_pref_no_unposted_ad;
        ad.is_online = true;
        ad.status    = 10;
      })
    );
    try {
      await queryFulfilled;
    } catch {
      // Server rejected — roll back the optimistic update
      patchResult.undo();
    }
  },
  // Still invalidate so a background refetch confirms the server state
  invalidatesTags: ['P2PAds'],
}),

// Delist ad
delistP2PAd: builder.mutation<{ message: string }, string>({
  query: (adId) => ({
    url: `/api/v1/p2p/ads/${adId}`,
    method: 'DELETE',
  }),
  invalidatesTags: ['P2PAds'],
}),

// Payment methods
getP2PPaymentMethods: builder.query<PaymentMethodsResponse, void>({
  query: () => ({
    url: '/api/v1/p2p/payment-methods',
    method: 'GET',
  }),
  providesTags: ['P2PPaymentMethods'],
}),

// Bybit balance
getP2PBybitBalance: builder.query<BalanceResponse, void>({
  query: () => ({
    url: '/api/v1/p2p/balance',
    method: 'GET',
  }),
}),

getP2PInsights: builder.query<InsightsResponse, InsightsParams>({
  query: ({ period }) => ({
    url: '/api/v1/p2p/insights',
    method: 'GET',
    params: { period },
  }),
}),

searchP2POrders: builder.query<OrdersResponse, string>({
  query: (q) => ({
    url: '/api/v1/p2p/orders/search',
    method: 'GET',
    params: { q },
  }),
}),

getAllP2POrders: builder.query<OrdersResponse, { status?: string }>({
  query: ({ status = 'all' }) => ({
    url: '/api/v1/p2p/orders/all',
    method: 'GET',
    params: { status },
  }),
  keepUnusedDataFor: 0,
}),

getP2PRatesPreview: builder.query<P2PRatesPreview, void>({
  query: () => ({
    url: '/api/v1/p2p/ads/preview-rates',
    method: 'GET',
  }),
  keepUnusedDataFor: 30,
}),

// Sync ads from Bybit
syncP2PAds: builder.mutation<{ message: string; synced: number }, void>({
  query: () => ({
    url: '/api/v1/p2p/ads/sync',
    method: 'POST',
  }),
  invalidatesTags: ['P2PAds'],
}),


// Toggle auto-update per ad
toggleP2PAdAutoUpdate: builder.mutation<{ message: string; enabled: boolean }, string>({
  query: (adId) => ({
    url: `/api/v1/p2p/ads/${adId}/toggle-auto-update`,
    method: 'POST',
  }),
  async onQueryStarted(adId, { dispatch, queryFulfilled }) {
    // We don't know the new value yet, so we optimistically flip it
    const patchResult = dispatch(
      p2pApi.util.updateQueryData('getP2PAds', undefined, (draft) => {
        const ad = draft.ads.find((a) => a.id === adId);
        if (ad) ad.trading_enabled = !ad.trading_enabled;
      })
    );
    try {
      await queryFulfilled;
    } catch {
      patchResult.undo();
    }
  },
  invalidatesTags: ['P2PAds'],
}),


removeP2PAdLocal: builder.mutation<{ message: string }, string>({
  query: (adId) => ({
    url: `/api/v1/p2p/ads/${adId}/remove-local`,
    method: 'DELETE',
  }),
  async onQueryStarted(adId, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      p2pApi.util.updateQueryData('getP2PAds', undefined, (draft) => {
        draft.ads = draft.ads.filter((a) => a.id !== adId);
      })
    );
    try {
      await queryFulfilled;
    } catch {
      patchResult.undo();
    }
  },
  invalidatesTags: ['P2PAds'],
}),



markMessagesRead: builder.mutation<{ message: string }, string>({
  query: (orderId) => ({
    url: `/api/v1/p2p/orders/${orderId}/messages/read`,
    method: "POST",
  }),
  // Invalidate orders so unread badge clears immediately
  invalidatesTags: (_result, _error, orderId) => [
    { type: "P2POrders" },
    { type: "P2POrderDetail", id: `${orderId}-messages` },
  ],
}),


verifyOrderDetails: builder.mutation<{ message: string; account_name: string; bank_code: string }, { orderId: string; account_number: string; bank_code: string; bank_name?: string; platform_fee?: string; verify_only: boolean }>({
  query: ({ orderId, ...body }) => ({
    url: `/api/v1/p2p/orders/${orderId}/verify-details`,
    method: 'POST',
    data: body,
  }),
  invalidatesTags: (_result, _error, { orderId }) => [
   { type: 'P2POrderDetail', id: orderId },
  { type: 'P2POrders' },
  ],
}),


  }),
});

export const {
  useGetP2PStatusQuery,
  useConnectP2PMutation,
  useDisconnectP2PMutation,
  useGetP2POrdersQuery,
  useGetP2POrderDetailQuery,
  useGetP2POrderMessagesQuery,    
  useSendP2PMessageMutation,  
   useGetUserP2PSettingsQuery,      
  useUpdateUserP2PSettingsMutation,  
  useMarkOrderAsPaidMutation,
  useReleaseOrderMutation,
  useGetP2PAdsQuery,
  useUpdateP2PAdMutation,
  useDelistP2PAdMutation,
  useGetP2PPaymentMethodsQuery,
  useGetP2PBybitBalanceQuery,
  useGetP2PInsightsQuery,
  useSearchP2POrdersQuery,
  useGetAllP2POrdersQuery,
  useGetP2PRatesPreviewQuery,
  useSyncP2PAdsMutation,
  useToggleP2PAdAutoUpdateMutation,
    useRemoveP2PAdLocalMutation,
    useGetP2PWhitelistIpsQuery,
    useMarkMessagesReadMutation,
    useVerifyOrderDetailsMutation,
} = p2pApi;
