import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { type NetworkDevice, createPreviewDevices } from "@/lib/router-adapter";

const STATUS_LABELS: Record<NetworkDevice["status"], string> = {
  allowed: "مسموح",
  pending: "بانتظار الموافقة",
  blocked: "محظور",
};

export default function HomeScreen() {
  const colors = useColors();
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [renameTarget, setRenameTarget] = useState<NetworkDevice | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [speedTarget, setSpeedTarget] = useState<NetworkDevice | null>(null);
  const [downloadValue, setDownloadValue] = useState("");
  const [uploadValue, setUploadValue] = useState("");

  const pendingCount = devices.filter((device) => device.status === "pending").length;
  const filteredDevices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return devices;
    return devices.filter((device) => `${device.name} ${device.ip} ${device.mac}`.toLowerCase().includes(normalized));
  }, [devices, query]);

  const refresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const changeStatus = (deviceId: string, status: NetworkDevice["status"]) => {
    setDevices((current) => current.map((device) => device.id === deviceId ? { ...device, status } : device));
  };

  const openRename = (device: NetworkDevice) => {
    setRenameTarget(device);
    setRenameValue(device.name);
  };

  const openSpeed = (device: NetworkDevice) => {
    setSpeedTarget(device);
    setDownloadValue(String(device.speedPolicy?.downloadKbps ?? 0));
    setUploadValue(String(device.speedPolicy?.uploadKbps ?? 0));
  };

  const saveSpeed = () => {
    if (!speedTarget) return;
    const downloadKbps = Number(downloadValue);
    const uploadKbps = Number(uploadValue);
    if (!Number.isFinite(downloadKbps) || !Number.isFinite(uploadKbps) || downloadKbps <= 0 || uploadKbps <= 0) return;
    setDevices((current) => current.map((device) => device.id === speedTarget.id ? { ...device, speedPolicy: { downloadKbps, uploadKbps } } : device));
    setSpeedTarget(null);
  };

  const saveRename = () => {
    if (!renameTarget || !renameValue.trim()) return;
    setDevices((current) => current.map((device) => device.id === renameTarget.id ? { ...device, name: renameValue.trim() } : device));
    setRenameTarget(null);
    setRenameValue("");
  };

  const loadPreview = () => {
    setDevices(createPreviewDevices());
    setShowPreview(true);
  };

  return (
    <ScreenContainer className="px-5 pt-4" containerClassName="bg-background">
      <FlatList
        data={filteredDevices}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 36 }}
        ListHeaderComponent={
          <View>
            <View className="mb-5 flex-row items-center justify-between">
              <View><Text className="text-sm font-medium text-muted">إدارة الشبكة المنزلية</Text><Text className="mt-1 text-3xl font-bold text-foreground">شبكتي</Text></View>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><IconSymbol name="wifi" size={25} color={colors.primary} /></View>
            </View>

            <View className="mb-4 rounded-3xl bg-surface p-5" style={{ borderWidth: 1, borderColor: colors.border }}>
              <View className="flex-row items-center justify-between"><View className="flex-row items-center gap-2"><View className="h-2.5 w-2.5 rounded-full bg-warning" /><Text className="text-sm font-semibold text-warning">جاهز للربط</Text></View>
<Text className="text-xs text-muted">ZTE ZXHN H168N</Text></View>
              <Text className="mt-5 text-4xl font-bold text-foreground">{devices.length}</Text><Text className="mt-1 text-sm text-muted">أجهزة محفوظة في التطبيق</Text>
              <Pressable onPress={refresh} style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }, { backgroundColor: colors.primary }]} className="mt-5 flex-row items-center justify-center rounded-2xl py-3.5"><IconSymbol name="refresh" size={18} color="#FFFFFF" /><Text className="mr-2 font-bold text-white">فحص الآن</Text></Pressable>
            </View>

            {pendingCount > 0 && <View className="mb-4 rounded-2xl bg-warning/10 p-4" style={{ borderWidth: 1, borderColor: colors.warning }}><View className="flex-row items-center gap-3"><IconSymbol name="notifications" size={22} color={colors.warning} /><View className="flex-1"><Text className="font-bold text-foreground">طلب اتصال يحتاج موافقتك</Text><Text className="mt-1 text-xs text-muted">راجع الأجهزة الجديدة قبل السماح لها بالإنترنت.</Text></View><Text className="text-xl font-bold text-warning">{pendingCount}</Text></View></View>}

            <View className="mb-4 flex-row items-center rounded-2xl bg-surface px-4" style={{ borderWidth: 1, borderColor: colors.border }}><IconSymbol name="search" size={20} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="ابحث باسم الجهاز أو IP أو MAC" placeholderTextColor={colors.muted} className="mr-2 flex-1 py-3.5 text-right text-sm text-foreground" returnKeyType="search" /></View>
            <View className="mb-3 flex-row items-center justify-between"><Text className="text-lg font-bold text-foreground">الأجهزة</Text><Text className="text-xs text-muted">اسحب للأسفل للتحديث</Text></View>
          </View>
        }
        ListEmptyComponent={<View className="items-center rounded-3xl bg-surface px-6 py-10" style={{ borderWidth: 1, borderColor: colors.border }}><View className="h-16 w-16 items-center justify-center rounded-3xl bg-primary/10"><IconSymbol name="devices" size={30} color={colors.primary} /></View><Text className="mt-4 text-center text-lg font-bold text-foreground">لا توجد بيانات بعد</Text><Text className="mt-2 text-center text-sm leading-6 text-muted">أضف الراوتر من الإعدادات ثم افحص الأجهزة المتصلة. يمكنك فتح المعاينة لاختبار الواجهة.</Text><Pressable onPress={loadPreview} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: colors.primary }]} className="mt-5 rounded-2xl px-5 py-3"><Text className="font-bold text-white">فتح المعاينة</Text></Pressable></View>}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl bg-surface p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
            <View className="flex-row items-start justify-between"><View className="flex-1 flex-row items-center"><View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10"><IconSymbol name={item.kind === "phone" ? "phone" : item.kind === "laptop" ? "laptop" : "devices"} size={22} color={colors.primary} /></View><View className="mr-3 flex-1"><Text className="font-bold text-foreground">{item.name}</Text><Text className="mt-1 text-xs text-muted">{item.ip} · {item.mac}</Text></View></View><View className="rounded-full px-2.5 py-1" style={{ backgroundColor: item.status === "allowed" ? `${colors.success}18` : item.status === "blocked" ? `${colors.error}18` : `${colors.warning}18` }}><Text className="text-xs font-semibold" style={{ color: item.status === "allowed" ? colors.success : item.status === "blocked" ? colors.error : colors.warning }}>{STATUS_LABELS[item.status]}</Text></View></View>
            <View className="mt-4 flex-row gap-2">{item.status === "pending" && <Pressable onPress={() => changeStatus(item.id, "allowed")} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: colors.success }]} className="flex-1 rounded-xl py-2.5"><Text className="text-center text-sm font-bold text-white">السماح</Text></Pressable>}{item.status !== "blocked" && <Pressable onPress={() => changeStatus(item.id, "blocked")} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: `${colors.error}12` }]} className="flex-1 rounded-xl py-2.5"><Text className="text-center text-sm font-bold text-error">حظر</Text></Pressable>}{item.status === "blocked" && <Pressable onPress={() => changeStatus(item.id, "allowed")} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: `${colors.success}12` }]} className="flex-1 rounded-xl py-2.5"><Text className="text-center text-sm font-bold text-success">إلغاء الحظر</Text></Pressable>}<Pressable onPress={() => openSpeed(item)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: `${colors.primary}12` }]} className="rounded-xl px-3 py-2.5"><Text className="text-sm font-bold text-primary">السرعة</Text></Pressable><Pressable onPress={() => openRename(item)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: `${colors.primary}12` }]} className="rounded-xl px-3 py-2.5"><Text className="text-sm font-bold text-primary">تسمية</Text></Pressable>
</View>
          </View>
        )}
        ListFooterComponent={showPreview ? <Text className="mt-2 text-center text-xs leading-5 text-muted">هذه بيانات معاينة فقط. التحكم الحقيقي يتطلب اختبار واجهة الراوتر وتفعيل MAC Filtering أو QoS من إصدار firmware لديك.</Text> : null}
      />
            <Modal visible={speedTarget !== null} transparent animationType="fade" onRequestClose={() => setSpeedTarget(null)}><View className="flex-1 items-center justify-center bg-black/40 px-6"><View className="w-full rounded-3xl bg-surface p-5" style={{ borderWidth: 1, borderColor: colors.border }}><Text className="text-xl font-bold text-foreground">تحديد السرعة</Text><Text className="mt-1 text-sm leading-6 text-muted">اكتب القيم بالكيلوبِت/ثانية. سيتم حفظها محليًا فقط إلى أن يتأكد التطبيق من دعم الراوتر.</Text><TextInput value={downloadValue} onChangeText={setDownloadValue} keyboardType="numeric" placeholder="التنزيل مثل 10000" placeholderTextColor={colors.muted} className="mt-5 rounded-2xl bg-background px-4 py-3.5 text-right text-foreground" style={{ borderWidth: 1, borderColor: colors.border }} /><TextInput value={uploadValue} onChangeText={setUploadValue} keyboardType="numeric" placeholder="الرفع مثل 2000" placeholderTextColor={colors.muted} className="mt-3 rounded-2xl bg-background px-4 py-3.5 text-right text-foreground" style={{ borderWidth: 1, borderColor: colors.border }} /><View className="mt-4 flex-row gap-3"><Pressable onPress={() => setSpeedTarget(null)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: `${colors.error}12` }]} className="flex-1 rounded-xl py-3"><Text className="text-center font-bold text-error">إلغاء</Text></Pressable><Pressable onPress={saveSpeed} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: colors.primary }]} className="flex-1 rounded-xl py-3"><Text className="text-center font-bold text-white">حفظ محليًا</Text></Pressable></View></View></View></Modal>
      <Modal visible={renameTarget !== null} transparent animationType="fade" onRequestClose={() => setRenameTarget(null)}>
<View className="flex-1 items-center justify-center bg-black/40 px-6"><View className="w-full rounded-3xl bg-surface p-5" style={{ borderWidth: 1, borderColor: colors.border }}><Text className="text-xl font-bold text-foreground">تسمية الجهاز</Text><Text className="mt-1 text-sm text-muted">اكتب اسمًا واضحًا ليسهل التعرف عليه.</Text><TextInput value={renameValue} onChangeText={setRenameValue} autoFocus className="mt-5 rounded-2xl bg-background px-4 py-3.5 text-right text-foreground" style={{ borderWidth: 1, borderColor: colors.border }} placeholderTextColor={colors.muted} returnKeyType="done" onSubmitEditing={saveRename} /><View className="mt-4 flex-row gap-3"><Pressable onPress={() => setRenameTarget(null)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: `${colors.error}12` }]} className="flex-1 rounded-xl py-3"><Text className="text-center font-bold text-error">إلغاء</Text></Pressable><Pressable onPress={saveRename} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, { backgroundColor: colors.primary }]} className="flex-1 rounded-xl py-3"><Text className="text-center font-bold text-white">حفظ</Text></Pressable></View></View></View></Modal>
    </ScreenContainer>
  );
}
