export const routes = {
  api: {
    v1: {
      auth: {
        login: "/api/v1/auth/login",
        register: "/api/v1/auth/register",
        resendEmailOtp: "/api/v1/auth/resend-email-otp",
        verifyEmail: "/api/v1/auth/verify-email",
        completeOnboarding: "/api/v1/auth/complete-onboarding",
        setPassword: "/api/v1/auth/set-password",
        forgotPassword: "/api/v1/auth/forgot-password",
        resetPassword: "/api/v1/auth/reset-password",
        changePassword: "/api/v1/auth/change-password",
        logout: "/api/v1/auth/logout",
      },
      account: {
        setTransactionPin: "/api/v1/account/set-transaction-pin",
        deactivate: "/api/v1/account/deactivate",
        reactivate: "/api/v1/account/reactivate",
        delete: "/api/v1/account/delete",
        getProfile: "/api/v1/account/profile",
        updateProfile: "/api/v1/account/profile",
        manageNotifications: "/api/v1/account/notifications",
        reserveAccount: "/api/v1/account/reserve-account",
      },
      bank: {
        list: "/api/v1/banks",
        resolveAccount: "/api/v1/bank/resolve-account",
      },
      services: {
        fetch: "/api/v1/trx/fetch",
        data: "/api/v1/trx/process/data",
        airtime: "/api/v1/trx/process/airtime",
        electricity: "/api/v1/trx/process/electricity",
        cable: "/api/v1/trx/process/cable",
        resolveMeter: "/api/v1/services/resolve-meter",
        resolveCable: "/api/v1/services/resolve-cable",
      },
    },
  },
  web: {
    v1: {},
  },
};

export const BASE_URL = "https://binapay.test";
