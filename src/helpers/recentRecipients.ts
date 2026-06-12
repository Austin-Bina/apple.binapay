import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "recent_recipients";
const MAX = 10;
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export type RecentRecipient = {
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  saved_at: number;
};

export const saveRecentRecipient = async (recipient: Omit<RecentRecipient, "saved_at">) => {
  try {
    const existing = await getRecentRecipients();
    // Remove duplicate if same account number exists
    const filtered = existing.filter(r => r.account_number !== recipient.account_number);
    const updated = [{ ...recipient, saved_at: Date.now() }, ...filtered].slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
};

export const getRecentRecipients = async (): Promise<RecentRecipient[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const all: RecentRecipient[] = JSON.parse(raw);
    const cutoff = Date.now() - TTL;
    return all.filter(r => r.saved_at > cutoff);
  } catch {
    return [];
  }
};
