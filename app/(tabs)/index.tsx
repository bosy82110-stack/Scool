import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { createId, loadStore, saveStore } from "@/features/hvac/storage";
import type { Equipment, EquipmentPhoto, HvacStore, MaintenanceEntry, Reading, ReadingMetric, SparePart, Villa } from "@/features/hvac/types";
import { EquipmentScreen, type DeviceTab, DashboardScreen, VillaScreen } from "@/features/hvac/Screens";
import { EntrySheet, LoadingView, type EntryField } from "@/features/hvac/HvacUI";

const equipmentFields: EntryField[] = [
  { key: "name", label: "اسم الغرفة أو الجهاز", placeholder: "مثال: غرفة النوم الرئيسية — سبليت", required: true },
  { key: "manufacturer", label: "الشركة المصنعة", placeholder: "Carrier، Daikin…" },
  { key: "type", label: "نوع الجهاز", placeholder: "Split / Package / VRF" },
  { key: "model", label: "الموديل" },
  { key: "capacity", label: "السعة", placeholder: "2 طن" },
  { key: "refrigerant", label: "نوع الفريون", placeholder: "R410A" },
  { key: "serialNo", label: "رقم الجهاز" },
  { key: "ratedAmps", label: "الأمبير المقنن", keyboardType: "decimal-pad" },
  { key: "suctionPressure", label: "ضغط السحب الأساسي (PSI)", keyboardType: "decimal-pad" },
  { key: "dischargePressure", label: "ضغط الطرد الأساسي (PSI)", keyboardType: "decimal-pad" },
  { key: "inletTemp", label: "حرارة هواء الدخول (°C)", keyboardType: "decimal-pad" },
  { key: "outletTemp", label: "حرارة هواء الخروج (°C)", keyboardType: "decimal-pad" },
  { key: "maintenanceIntervalDays", label: "دورية الصيانة بالأيام", placeholder: "60", keyboardType: "number-pad" },
  { key: "notes", label: "ملاحظات", multiline: true },
];

const readingFields: EntryField[] = [
  { key: "amps", label: "الأمبير (A)", placeholder: "مثال: 8.2", keyboardType: "decimal-pad", required: true },
  { key: "suctionPressure", label: "ضغط السحب / المنخفض (PSI)", placeholder: "مثال: 118", keyboardType: "decimal-pad" },
  { key: "dischargePressure", label: "ضغط الطرد / المرتفع (PSI)", placeholder: "مثال: 365", keyboardType: "decimal-pad" },
  { key: "inletTemp", label: "حرارة هواء الدخول (°C)", placeholder: "مثال: 27", keyboardType: "decimal-pad" },
  { key: "outletTemp", label: "حرارة هواء الخروج (°C)", placeholder: "مثال: 14", keyboardType: "decimal-pad" },
  { key: "notes", label: "ملاحظات الفني", placeholder: "حالة الفلتر أو أي ملاحظة", multiline: true },
];

const maintenanceFields: EntryField[] = [
  { key: "title", label: "الأعمال المنفذة", placeholder: "تنظيف فلتر، قياس ضغوط…", required: true },
  { key: "date", label: "التاريخ", placeholder: "2026-10-01", required: true },
  { key: "details", label: "التفاصيل والملاحظات", multiline: true },
];

const partFields: EntryField[] = [
  { key: "name", label: "اسم القطعة", placeholder: "Capacitor / Contactor / Compressor…", required: true },
  { key: "date", label: "تاريخ التغيير", placeholder: "2026-10-01", required: true },
  { key: "oldPart", label: "القطعة القديمة", placeholder: "النوع أو رقم القطعة" },
  { key: "newPart", label: "القطعة الجديدة", placeholder: "النوع أو رقم القطعة" },
  { key: "partNumber", label: "رقم القطعة" },
  { key: "notes", label: "ملاحظات", multiline: true },
];

type FormKind = "villa" | "equipment" | "reading" | "maintenance" | "part";
type FormState = { kind: FormKind; equipmentId?: string; recordId?: string } | null;
type EntryValues = Record<string, string>;

const dateInput = () => new Date().toISOString().slice(0, 10);
const numericOrUndefined = (value: string | undefined) => value?.trim() ? Number(value.replace(",", ".")) : undefined;
const parsedDate = (value: string | undefined) => {
  if (!value?.trim()) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export default function HomeScreen() {
  const [store, setStore] = useState<HvacStore>({ villas: [], equipment: [] });
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<"home" | "villa" | "equipment">("home");
  const [villaId, setVillaId] = useState<string | null>(null);
  const [equipmentId, setEquipmentId] = useState<string | null>(null);
  const [deviceTab, setDeviceTab] = useState<DeviceTab>("overview");
  const [periodDays, setPeriodDays] = useState(90);
  const [metric, setMetric] = useState<ReadingMetric>("amps");
  const [form, setForm] = useState<FormState>(null);
  const [values, setValues] = useState<EntryValues>({});
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadStore().then((saved) => {
      if (mounted) {
        setStore(saved);
        setLoaded(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveStore(store).then(() => setStorageError(false)).catch(() => setStorageError(true));
  }, [loaded, store]);

  const selectedVilla = useMemo(() => store.villas.find((item) => item.id === villaId) ?? null, [store.villas, villaId]);
  const selectedEquipment = useMemo(() => store.equipment.find((item) => item.id === equipmentId) ?? null, [store.equipment, equipmentId]);
  const villaEquipment = useMemo(() => store.equipment.filter((item) => item.villaId === villaId), [store.equipment, villaId]);

  const patchStore = (updater: (current: HvacStore) => HvacStore) => setStore((current) => updater(current));

  const showForm = (kind: FormKind, initial: EntryValues = {}, recordId?: string) => {
    setPhotoUri(initial.photoUri);
    setValues(initial);
    setForm({ kind, equipmentId: equipmentId ?? undefined, recordId });
  };

  const openVillaForm = (villa?: Villa) => showForm("villa", villa ? { name: villa.name } : {}, villa?.id);

  const openEquipmentForm = (equipment?: Equipment) => {
    const initial: EntryValues = equipment ? {
      name: equipment.name,
      manufacturer: equipment.manufacturer,
      type: equipment.type,
      model: equipment.model,
      capacity: equipment.capacity,
      refrigerant: equipment.refrigerant,
      serialNo: equipment.serialNo,
      ratedAmps: equipment.ratedAmps,
      suctionPressure: equipment.suctionPressure,
      dischargePressure: equipment.dischargePressure,
      inletTemp: equipment.inletTemp,
      outletTemp: equipment.outletTemp,
      maintenanceIntervalDays: String(equipment.maintenanceIntervalDays),
      notes: equipment.notes,
    } : { maintenanceIntervalDays: "60" };
    showForm("equipment", initial, equipment?.id);
  };

  const openReadingForm = () => showForm("reading", {});
  const openMaintenanceForm = () => showForm("maintenance", { date: dateInput() });
  const openPartForm = () => showForm("part", { date: dateInput() });

  const saveEntry = () => {
    if (!form) return;
    const now = new Date().toISOString();

    if (form.kind === "villa") {
      const name = values.name?.trim();
      if (!name) return;
      if (form.recordId) {
        patchStore((current) => ({ ...current, villas: current.villas.map((item) => item.id === form.recordId ? { ...item, name } : item) }));
      } else {
        const item: Villa = { id: createId(), name, createdAt: now };
        patchStore((current) => ({ ...current, villas: [...current.villas, item] }));
        setVillaId(item.id);
        setScreen("villa");
      }
    }

    if (form.kind === "equipment") {
      if (!villaId) return;
      const current = store.equipment.find((item) => item.id === form.recordId);
      const interval = Math.min(365, Math.max(1, Number(values.maintenanceIntervalDays) || 60));
      const updated: Equipment = {
        id: current?.id ?? createId(),
        villaId,
        name: values.name?.trim() ?? "جهاز جديد",
        manufacturer: values.manufacturer?.trim() ?? "",
        type: values.type?.trim() ?? "",
        model: values.model?.trim() ?? "",
        capacity: values.capacity?.trim() ?? "",
        refrigerant: values.refrigerant?.trim() ?? "",
        serialNo: values.serialNo?.trim() ?? "",
        ratedAmps: values.ratedAmps?.trim() ?? "",
        suctionPressure: values.suctionPressure?.trim() ?? "",
        dischargePressure: values.dischargePressure?.trim() ?? "",
        inletTemp: values.inletTemp?.trim() ?? "",
        outletTemp: values.outletTemp?.trim() ?? "",
        notes: values.notes?.trim() ?? "",
        maintenanceIntervalDays: interval,
        createdAt: current?.createdAt ?? now,
        readings: current?.readings ?? [],
        maintenance: current?.maintenance ?? [],
        parts: current?.parts ?? [],
        photos: current?.photos ?? [],
      };
      patchStore((state) => ({ ...state, equipment: current ? state.equipment.map((item) => item.id === current.id ? updated : item) : [...state.equipment, updated] }));
      setEquipmentId(updated.id);
      setScreen("equipment");
      setDeviceTab("overview");
    }

    if (form.kind === "reading" && form.equipmentId) {
      const reading: Reading = {
        id: createId(),
        timestamp: now,
        amps: numericOrUndefined(values.amps),
        suctionPressure: numericOrUndefined(values.suctionPressure),
        dischargePressure: numericOrUndefined(values.dischargePressure),
        inletTemp: numericOrUndefined(values.inletTemp),
        outletTemp: numericOrUndefined(values.outletTemp),
        notes: values.notes?.trim(),
      };
      patchStore((state) => ({ ...state, equipment: state.equipment.map((item) => item.id === form.equipmentId ? { ...item, readings: [...item.readings, reading] } : item) }));
      setDeviceTab("readings");
    }

    if (form.kind === "maintenance" && form.equipmentId) {
      const entry: MaintenanceEntry = { id: createId(), date: parsedDate(values.date), title: values.title?.trim() ?? "صيانة دورية", details: values.details?.trim() };
      patchStore((state) => ({ ...state, equipment: state.equipment.map((item) => item.id === form.equipmentId ? { ...item, maintenance: [...item.maintenance, entry] } : item) }));
      setDeviceTab("maintenance");
    }

    if (form.kind === "part" && form.equipmentId) {
      const entry: SparePart = { id: createId(), date: parsedDate(values.date), name: values.name?.trim() ?? "قطعة غيار", oldPart: values.oldPart?.trim(), newPart: values.newPart?.trim(), partNumber: values.partNumber?.trim(), notes: values.notes?.trim(), photoUri };
      patchStore((state) => ({ ...state, equipment: state.equipment.map((item) => item.id === form.equipmentId ? { ...item, parts: [...item.parts, entry] } : item) }));
      setDeviceTab("parts");
    }

    setForm(null);
    setValues({});
    setPhotoUri(undefined);
  };

  const chooseImage = async (): Promise<string | undefined> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.78 });
      if (result.canceled || !result.assets[0]) return undefined;
      return result.assets[0].uri;
    } catch {
      if (Platform.OS === "web") {
        Alert.alert("تعذّر فتح الصور", "تعذّر الوصول إلى منتقي الصور في هذا المتصفح.");
      }
      return undefined;
    }
  };

  const pickPartPhoto = async () => {
    const uri = await chooseImage();
    if (uri) setPhotoUri(uri);
  };

  const addEquipmentPhoto = async () => {
    if (!equipmentId) return;
    const uri = await chooseImage();
    if (!uri) return;
    const photo: EquipmentPhoto = { id: createId(), uri, date: new Date().toISOString() };
    patchStore((state) => ({ ...state, equipment: state.equipment.map((item) => item.id === equipmentId ? { ...item, photos: [...item.photos, photo] } : item) }));
    setDeviceTab("photos");
  };

  const currentFields: EntryField[] = form?.kind === "villa"
    ? [{ key: "name", label: "اسم الفيلا أو المبنى", placeholder: "مثال: الفيلا الرئيسية", required: true }]
    : form?.kind === "equipment" ? equipmentFields
      : form?.kind === "reading" ? readingFields
        : form?.kind === "maintenance" ? maintenanceFields
          : form?.kind === "part" ? partFields : [];
  const formTitle = form?.kind === "villa"
    ? form.recordId ? "تعديل اسم الموقع" : "إضافة فيلا جديدة"
    : form?.kind === "equipment"
      ? form.recordId ? "تعديل بيانات الجهاز" : "إضافة جهاز تكييف"
      : form?.kind === "reading" ? "قراءة أسبوعية جديدة"
        : form?.kind === "maintenance" ? "تسجيل أعمال صيانة"
          : form?.kind === "part" ? "تسجيل قطعة غيار" : "";
  const formSubtitle = form?.kind === "reading" ? "سيُحفظ تاريخ ووقت التسجيل تلقائيًا" : form?.kind === "maintenance" || form?.kind === "part" ? "يمكنك إدخال التاريخ بصيغة سنة-شهر-يوم" : undefined;

  const goHome = () => {
    setScreen("home");
    setVillaId(null);
    setEquipmentId(null);
  };

  if (!loaded) return <LoadingView />;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F3F6F7]" className="flex-1">
      {screen === "home" ? (
        <DashboardScreen
          villas={store.villas}
          equipment={store.equipment}
          onAddVilla={() => openVillaForm()}
          onOpenVilla={(id) => { setVillaId(id); setScreen("villa"); }}
          onOpenEquipment={(id) => {
            const target = store.equipment.find((item) => item.id === id);
            if (!target) return;
            setVillaId(target.villaId);
            setEquipmentId(id);
            setDeviceTab("overview");
            setScreen("equipment");
          }}
        />
      ) : null}
      {screen === "villa" && selectedVilla ? (
        <VillaScreen
          villa={selectedVilla}
          equipment={villaEquipment}
          onBack={goHome}
          onEditVilla={() => openVillaForm(selectedVilla)}
          onAddEquipment={() => openEquipmentForm()}
          onOpenEquipment={(id) => { setEquipmentId(id); setDeviceTab("overview"); setScreen("equipment"); }}
        />
      ) : null}
      {screen === "equipment" && selectedEquipment ? (
        <EquipmentScreen
          equipment={selectedEquipment}
          villaName={selectedVilla?.name ?? "موقع غير معروف"}
          tab={deviceTab}
          setTab={setDeviceTab}
          onBack={() => { setScreen("villa"); setEquipmentId(null); }}
          onEdit={() => openEquipmentForm(selectedEquipment)}
          onAddReading={openReadingForm}
          onAddMaintenance={openMaintenanceForm}
          onAddPart={openPartForm}
          onAddPhoto={addEquipmentPhoto}
          days={periodDays}
          setDays={setPeriodDays}
          metric={metric}
          setMetric={setMetric}
        />
      ) : null}
      {storageError ? <View style={{ position: "absolute", bottom: 14, left: 18, right: 18, backgroundColor: "#FCE9E7", padding: 10, borderRadius: 12 }}><Text style={{ color: "#B8473E", fontSize: 11, textAlign: "right" }}>تعذّر حفظ آخر تعديل محليًا. تحقق من مساحة الجهاز ثم أعد المحاولة.</Text></View> : null}
      <EntrySheet
        visible={Boolean(form)}
        title={formTitle}
        subtitle={formSubtitle}
        fields={currentFields}
        values={values}
        onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        onSubmit={saveEntry}
        onCancel={() => { setForm(null); setPhotoUri(undefined); }}
        onPickPhoto={form?.kind === "part" ? pickPartPhoto : undefined}
        photoUri={photoUri}
      />
    </ScreenContainer>
  );
}
