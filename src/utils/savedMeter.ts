import AsyncStorage from "@react-native-async-storage/async-storage";
import { METER_TYPE } from "@enum/providers";

export type SavedMeter = {
  provider: string;
  meter_type: METER_TYPE;
  meter_number: string;
};

const keyFor = (userId?: string | number) => `last_electricity_meter:${userId ?? "guest"}`;

export async function getSavedMeter(userId?: string | number): Promise<SavedMeter | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    return raw ? (JSON.parse(raw) as SavedMeter) : null;
  } catch {
    return null;
  }
}

export async function saveMeter(userId: string | number | undefined, meter: SavedMeter) {
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(meter));
  } catch {
    // storage failure shouldn't block payment
  }
}
