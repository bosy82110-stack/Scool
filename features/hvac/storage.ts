import AsyncStorage from "@react-native-async-storage/async-storage";
import type { HvacStore } from "./types";

const STORAGE_KEY = "miqyas-hvac-store-v1";

export const emptyStore = (): HvacStore => ({ villas: [], equipment: [] });

export async function loadStore(): Promise<HvacStore> {
  try {
    const serialized = await AsyncStorage.getItem(STORAGE_KEY);
    if (!serialized) return emptyStore();
    const parsed = JSON.parse(serialized) as Partial<HvacStore>;
    return {
      villas: Array.isArray(parsed.villas) ? parsed.villas : [],
      equipment: Array.isArray(parsed.equipment)
        ? parsed.equipment.map((unit) => ({
            ...unit,
            readings: Array.isArray(unit.readings) ? unit.readings : [],
            maintenance: Array.isArray(unit.maintenance) ? unit.maintenance : [],
            parts: Array.isArray(unit.parts) ? unit.parts : [],
            photos: Array.isArray(unit.photos) ? unit.photos : [],
          }))
        : [],
    };
  } catch {
    return emptyStore();
  }
}

export async function saveStore(store: HvacStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
