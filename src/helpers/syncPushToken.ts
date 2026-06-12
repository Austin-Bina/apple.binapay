import api from "../lib/api";

export async function syncPushToken(token: string) {
  try {
    await api.post("/api/v1/user/push-token", {
      push_token: token,
    });
    console.log("✅ Push token synced");
  } catch (error: any) {
    console.error(
      "❌ Push token sync failed:",
      error?.response?.data || error.message
    );
  }
}
