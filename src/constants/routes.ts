export const routes = {
  api: {
    v1: {
      auth: {
        login: "/api/v1/auth/login",
        register: "/api/v1/auth/register",
        resendEmailOtp: "/api/v1/auth/resend-email-otp",
        verifyEmail: "/api/v1/auth/verify-email",
        completeOnboarding: "/api/v1/auth/complete-onboarding",
        forgotPassword: "/api/v1/auth/forgot-password",
        verifyOtp: "/api/v1/auth/verify-otp",
        resetPassword: "/api/v1/auth/reset-password",
        changePassword: "/api/v1/auth/change-password",
        logout: "/api/v1/auth/logout",
        getAblyToken: "/api/v1/auth/get-ably-token",
      },
      account: {
        setTransactionPin: "/api/v1/account/set-transaction-pin",
        deactivate: "/api/v1/account/deactivate",
        reactivate: "/api/v1/account/reactivate",
        delete: "/api/v1/account/delete",
        getProfile: "/api/v1/account/profile",
        updateProfile: "/api/v1/account/profile",
        manageNotifications: "/api/v1/account/notifications",
        recentTransactions: "/api/v1/account/recent-transactions",
        transactions: "/api/v1/account/transactions",
        referralActivities: "/api/v1/account/referral-activities",
        settings: "/api/v1/account/settings",
      },
      notification: {
        index: "/api/v1/notifications",
        view: "/api/v1/notifications/:id",
        markAsRead: "/api/v1/notifications/read",
        markAllAsRead: "/api/v1/notifications/read_all",
        clearDeviceDetails: "/api/v1/notifications/clear_device_details",
      },
      kyc: {
        verifyBvn: "/api/v1/kyc/verify-bvn",
        verifyNin: "/api/v1/kyc/verify-nin",
      },
      bank: {
        resolveAccount: "/api/v1/bank/resolve",
        reserveAccount: "/api/v1/bank/create-dedicated-account",
        list: "/api/v1/banks",
        listDedicatedAccounts: "/api/v1/bank/list-dva-accounts",
        createDedicatedAccounts: "/api/v1/bank/create-dedicated-account",
      },
      services: {
        fetch: "/api/v1/payment/fetch",
        data: "/api/v1/payment/process/data",
        airtime: "/api/v1/payment/process/airtime",
        electricity: "/api/v1/payment/process/electricity",
        epins: "/api/v1/payment/process/epins",
        cable: "/api/v1/payment/process/cable",
        resolveMeter: "/api/v1/services/resolve-meter",
        resolveCable: "/api/v1/services/resolve-cable",
        education: {
          purchase: "/api/v1/education/purchase",
          serviceDetails: "/api/v1/education/service-details",
        },
      },
      funding: {
        banks: "/api/v1/funding/banks",
        initiate: "/api/v1/funding/initiate",
        uploadProof: "/api/v1/funding/upload-proof",
      },
      transactions: {
        get: "/api/v1/transaction/:id",
      },
      support: {
        initiate: "/api/v1/support/initiate",
        departments: "/api/v1/support/departments",
        createTicket: "/api/v1/support/create-ticket",
        viewTicket: "/api/v1/support/ticket/:ticketId",
        addResponse: "/api/v1/support/ticket/:ticketId/add-response",
        conversations: "/api/v1/support/conversations/:conversationId",
        history: "/api/v1/support/tickets",
      },
      resources: {
        checkAppVersion: "/api/v1/resources/check-app-version",
      },
    },
  },
  web: {
    v1: {
      public: {
        privacy: "https://binapay.co/terms-and-policy",
      },
      auth: {
        register: "https://binapay.co/register",
      },
    },
  },
};
