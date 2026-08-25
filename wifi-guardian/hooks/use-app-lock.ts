import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

const BIOMETRIC_LOCK_KEY = "wifi-guardian.biometric-lock";

export function useAppLock(timeoutMs = 60_000) {
  const [isLocked, setIsLocked] = useState(false);
  const backgroundAt = useRef<number | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "background") {
        backgroundAt.current = Date.now();
        return;
      }
      if (state !== "active" || !backgroundAt.current || Date.now() - backgroundAt.current < timeoutMs) return;
      backgroundAt.current = null;
      const enabled = (await AsyncStorage.getItem(BIOMETRIC_LOCK_KEY)) === "true";
      if (!enabled) return;
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) return;
      setIsLocked(true);
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: "افتح WiFi Guardian", cancelLabel: "إلغاء" });
      setIsLocked(!result.success);
    });
    return () => subscription.remove();
  }, [timeoutMs]);

  return isLocked;
}
