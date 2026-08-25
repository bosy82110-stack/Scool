import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, Switch, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const ROUTER_ADDRESS_KEY = "wifi-guardian.router-address";
const BIOMETRIC_LOCK_KEY = "wifi-guardian.biometric-lock";

export default function SettingsScreen() {
  const colors = useColors();
  const [routerAddress, setRouterAddress] = useState("192.168.1.1");
  const [biometricLock, setBiometricLock] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const [storedAddress, storedLock] = await Promise.all([AsyncStorage.getItem(ROUTER_ADDRESS_KEY), AsyncStorage.getItem(BIOMETRIC_LOCK_KEY)]);
      if (storedAddress) setRouterAddress(storedAddress);
      if (storedLock) setBiometricLock(storedLock === "true");
    })();
  }, []);

  const updateBiometricLock = async (enabled: boolean) => {
    if (enabled && Platform.OS === "android") {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert("البصمة غير جاهزة", "فعّل بصمة أو قفلًا حيويًا من إعدادات الهاتف أولًا.");
        return;
      }
    }
    setBiometricLock(enabled);
    await AsyncStorage.setItem(BIOMETRIC_LOCK_KEY, String(enabled));
  };

  const testConnection = async () => {
    setSaving(true);
    await AsyncStorage.setItem(ROUTER_ADDRESS_KEY, routerAddress.trim());
    await new Promise((resolve) => setTimeout(resolve, 650));
    setSaving(false);
    Alert.alert("اختبار الاتصال", "تم حفظ العنوان محليًا. لم يتم تنفيذ اتصال فعلي بعد؛ سيتم ربط هذا الحقل بواجهة الراوتر بعد تأكيد إصدار الـ firmware.");
  };

  return (
    <ScreenContainer className="px-5 pt-4">
      <Text className="text-3xl font-bold text-foreground">الإعدادات</Text>
      <Text className="mt-1 text-sm text-muted">اضبط طريقة اتصال التطبيق بشبكتك.</Text>

      <View className="mt-6 rounded-3xl bg-surface p-5" style={{ borderWidth: 1, borderColor: colors.border }}>
        <View className="flex-row items-center gap-3"><View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10"><IconSymbol name="router" size={22} color={colors.primary} /></View><View><Text className="font-bold text-foreground">الراوتر الأساسي</Text><Text className="mt-1 text-xs text-muted">ZTE ZXHN H168N</Text></View></View>
        <Text className="mb-2 mt-5 text-sm font-semibold text-foreground">عنوان لوحة الإدارة</Text>
        <TextInput value={routerAddress} onChangeText={setRouterAddress} keyboardType="url" autoCapitalize="none" className="rounded-2xl bg-background px-4 py-3.5 text-right text-foreground" style={{ borderWidth: 1, borderColor: colors.border }} placeholderTextColor={colors.muted} />
        <Pressable onPress={testConnection} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: colors.primary }]} className="mt-4 rounded-2xl py-3.5"><Text className="text-center font-bold text-white">{saving ? "جارٍ الحفظ…" : "حفظ واختبار الاتصال"}</Text></Pressable>
      </View>

      <View className="mt-4 rounded-3xl bg-surface" style={{ borderWidth: 1, borderColor: colors.border }}>
        <View className="flex-row items-center justify-between p-5"><View className="flex-1"><Text className="font-bold text-foreground">قفل التطبيق بالبصمة</Text><Text className="mt-1 text-xs leading-5 text-muted">احمِ أوامر الحظر والسماح من الوصول غير المصرح.</Text></View><Switch value={biometricLock} onValueChange={updateBiometricLock} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" /></View>
        <View className="mx-5 border-t" style={{ borderColor: colors.border }} />
        <View className="flex-row items-center gap-3 p-5"><IconSymbol name="shield" size={21} color={colors.success} /><Text className="flex-1 text-sm leading-5 text-muted">بيانات الدخول لا تُرسل إلى أي خدمة خارجية في النسخة المحلية.</Text></View>
      </View>

      <View className="mt-5 rounded-2xl bg-warning/10 p-4" style={{ borderWidth: 1, borderColor: colors.warning }}><Text className="font-bold text-warning">تنبيه حول السرعة</Text><Text className="mt-1 text-sm leading-6 text-foreground">إصدار H168N قد يوفر QoS كأولوية مرور، لكنه قد لا يوفّر حدًا صارمًا للسرعة لكل جهاز. سيظهر ذلك بوضوح بعد اختبار الراوتر.</Text></View>
    </ScreenContainer>
  );
}
