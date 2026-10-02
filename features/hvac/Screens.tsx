import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Equipment, ReadingMetric, Villa } from "./types";
import { filteredReadings, formatDate, latestReading, metricLabels, maintenanceDue, readingAlerts, sortReadings } from "./insights";
import { TrendChart } from "./TrendChart";
import { C, Card, CircleStat, EmptyState, Header, Page, PrimaryButton, SectionTitle, SmallButton, StatTile, StatusPill } from "./HvacUI";

export type DeviceTab = "overview" | "readings" | "maintenance" | "compare" | "parts" | "photos";

const villaTones = [
  { background: "#DDF4F1", border: "#B3E3DC", icon: "#087E8B" },
  { background: "#E8E8FC", border: "#D0D0F3", icon: "#6660B5" },
  { background: "#FFF0D7", border: "#F2DEB6", icon: "#B7771A" },
  { background: "#E4EFFB", border: "#C9DCF4", icon: "#3972B5" },
  { background: "#FBE6E3", border: "#F0D0CB", icon: "#B8473E" },
  { background: "#E7F2E5", border: "#CEE3CA", icon: "#4E8655" },
] as const;

export function DashboardScreen({
  villas,
  equipment,
  onAddVilla,
  onOpenVilla,
  onOpenEquipment,
}: {
  villas: Villa[];
  equipment: Equipment[];
  onAddVilla: () => void;
  onOpenVilla: (id: string) => void;
  onOpenEquipment: (id: string) => void;
}) {
  const alertRows = equipment.flatMap((unit) => {
    const villa = villas.find((item) => item.id === unit.villaId);
    const rows = [] as { id: string; title: string; detail: string; tone: "red" | "amber"; onPress: () => void }[];
    if (maintenanceDue(unit)) rows.push({ id: `${unit.id}-service`, title: `صيانة دورية مستحقة · ${unit.name}`, detail: `موعد الصيانة كل ${unit.maintenanceIntervalDays} يوم`, tone: "amber", onPress: () => onOpenEquipment(unit.id) });
    readingAlerts(unit).forEach((message, index) => rows.push({ id: `${unit.id}-reading-${index}`, title: `قراءة تحتاج مراجعة · ${unit.name}`, detail: message, tone: "red", onPress: () => onOpenEquipment(unit.id) }));
    if (!villa) return [];
    return rows;
  }).slice(0, 4);
  const activeUnits = equipment.length;
  const latestDates = equipment.flatMap((unit) => unit.readings.map((reading) => reading.timestamp)).sort((a, b) => Date.parse(b) - Date.parse(a));

  return (
    <Page>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Header title="مِقياس" subtitle="إدارة ومتابعة تكييفات القصر" />
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row-reverse", gap: 6, marginTop: 8, marginBottom: 22 }}>
            <CircleStat label="الفلل" value={villas.length} accent={C.teal} background={C.mint} />
            <CircleStat label="الأجهزة" value={activeUnits} accent={C.navy} background="#E8EEF4" />
            <CircleStat label="تحتاج متابعة" value={alertRows.length} accent={alertRows.length ? C.red : C.green} background={alertRows.length ? C.redBg : C.greenBg} />
          </View>

          <View style={{ marginTop: 24 }}>
            <SectionTitle title="التنبيهات والمتابعة" note="تغيّر ملحوظ في قراءة أو موعد صيانة" />
            {alertRows.length ? (
              <View style={{ gap: 8 }}>
                {alertRows.map((alert) => (
                  <Pressable key={alert.id} onPress={alert.onPress} style={{ flexDirection: "row-reverse", gap: 11, alignItems: "center", backgroundColor: C.white, padding: 13, borderRadius: 16, borderWidth: 1, borderColor: alert.tone === "red" ? "#F4D4D1" : "#F1E1C5" }}>
                    <View style={{ width: 9, height: 9, borderRadius: 8, backgroundColor: alert.tone === "red" ? C.red : C.amber }} />
                    <View style={{ flex: 1, alignItems: "flex-end" }}><Text style={{ color: C.ink, fontWeight: "800", fontSize: 12, textAlign: "right" }}>{alert.title}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 3, textAlign: "right" }}>{alert.detail}</Text></View>
                    <Text style={{ color: C.muted, fontSize: 18 }}>‹</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={{ backgroundColor: C.greenBg, borderRadius: 16, padding: 14, flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: C.white, alignItems: "center", justifyContent: "center" }}><Text style={{ color: C.green, fontWeight: "900" }}>✓</Text></View>
                <View style={{ flex: 1, alignItems: "flex-end" }}><Text style={{ color: C.green, fontWeight: "900", fontSize: 13 }}>ما فيه تنبيهات حالية</Text><Text style={{ color: "#628472", fontSize: 11, marginTop: 3, textAlign: "right" }}>ستظهر هنا الأجهزة المستحقة للصيانة أو ذات التغيّر الملحوظ.</Text></View>
              </View>
            )}
          </View>

          <View style={{ marginTop: 24 }}>
            <SectionTitle title="الفلل والمباني" note="اختر موقعًا لعرض أجهزته" action="＋ إضافة" onAction={onAddVilla} />
            {villas.length === 0 ? (
              <>
                <EmptyState title="ابدأ بإضافة أول فيلا" description="سمّ الموقع، ثم أضف الغرف وأجهزة التكييف لتبدأ سجل القراءات والصيانة." />
                <View style={{ marginTop: 12 }}><PrimaryButton title="＋ إضافة فيلا جديدة" onPress={onAddVilla} /></View>
              </>
            ) : (
              <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "space-between", rowGap: 18 }}>
                {villas.map((villa, index) => {
                  const count = equipment.filter((unit) => unit.villaId === villa.id).length;
                  const tone = villaTones[index % villaTones.length];
                  return (
                    <Pressable key={villa.id} accessibilityRole="button" accessibilityLabel={`${villa.name}، ${count} أجهزة`} onPress={() => onOpenVilla(villa.id)} style={({ pressed }) => [{ width: "31%", alignItems: "center" }, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]}>
                      <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: tone.background, borderWidth: 1, borderColor: tone.border, alignItems: "center", justifyContent: "center" }}>
                        <MaterialCommunityIcons name="home-variant" size={35} color={tone.icon} />
                      </View>
                      <Text numberOfLines={1} style={{ width: "100%", color: C.ink, fontSize: 12, fontWeight: "900", textAlign: "center", marginTop: 7 }}>{villa.name}</Text>
                      <Text style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{count} {count === 1 ? "جهاز" : "أجهزة"}</Text>
                    </Pressable>
                  );
                })}
                <Pressable accessibilityRole="button" accessibilityLabel="إضافة فيلا جديدة" onPress={onAddVilla} style={({ pressed }) => [{ width: "31%", alignItems: "center" }, pressed && { opacity: 0.75 }]}>
                  <View style={{ width: 78, height: 78, borderRadius: 39, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#A9BDC2", backgroundColor: C.white, alignItems: "center", justifyContent: "center" }}>
                    <MaterialCommunityIcons name="plus" size={30} color={C.teal} />
                  </View>
                  <Text numberOfLines={1} style={{ color: C.teal, fontSize: 12, fontWeight: "800", textAlign: "center", marginTop: 7 }}>إضافة فيلا</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={{ marginTop: 22, paddingHorizontal: 2, flexDirection: "row-reverse", justifyContent: "space-between" }}>
            <Text style={{ color: C.muted, fontSize: 10 }}>حُفظت البيانات على هذا الجهاز</Text>
            <Text style={{ color: C.muted, fontSize: 10 }}>{latestDates[0] ? `آخر قراءة · ${formatDate(latestDates[0])}` : "سجل جديد"}</Text>
          </View>
        </View>
      </ScrollView>
    </Page>
  );
}

export function VillaScreen({
  villa,
  equipment,
  onBack,
  onEditVilla,
  onAddEquipment,
  onOpenEquipment,
}: {
  villa: Villa;
  equipment: Equipment[];
  onBack: () => void;
  onEditVilla: () => void;
  onAddEquipment: () => void;
  onOpenEquipment: (id: string) => void;
}) {
  return (
    <Page>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <Header title={villa.name} subtitle="الأماكن وأجهزة التكييف" onBack={onBack} actionLabel="تعديل" onAction={onEditVilla} />
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: C.navy, borderRadius: 20, padding: 17, marginBottom: 20 }}>
            <Text style={{ color: "#A6E4DF", textAlign: "right", fontSize: 11, fontWeight: "800" }}>موقع الصيانة</Text>
            <Text style={{ color: C.white, textAlign: "right", fontSize: 23, fontWeight: "900", marginTop: 5 }}>{villa.name}</Text>
            <Text style={{ color: "#C7D8E2", textAlign: "right", fontSize: 12, marginTop: 4 }}>{equipment.length} أجهزة مسجلة في هذا الموقع</Text>
          </View>
          <SectionTitle title="الغرف والأجهزة" note="اسم المكان أو الجهاز حسب نظامك" action="＋ إضافة جهاز" onAction={onAddEquipment} />
          {equipment.length === 0 ? (
            <>
              <EmptyState title="لا توجد أجهزة في هذا الموقع" description="أضف أول جهاز، مثل «غرفة النوم الرئيسية — سبليت 2 طن»." />
              <View style={{ marginTop: 12 }}><PrimaryButton title="＋ إضافة جهاز تكييف" onPress={onAddEquipment} /></View>
            </>
          ) : (
            <View style={{ gap: 10 }}>
              {equipment.map((unit) => {
                const last = latestReading(unit);
                const due = maintenanceDue(unit);
                return (
                  <Pressable key={unit.id} onPress={() => onOpenEquipment(unit.id)} style={({ pressed }) => [{ backgroundColor: C.white, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: C.line }, pressed && { opacity: 0.8 }]}>
                    <View style={{ flexDirection: "row-reverse", gap: 12, alignItems: "center" }}>
                      <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" }}><Text style={{ color: C.teal, fontSize: 20, fontWeight: "900" }}>❄</Text></View>
                      <View style={{ flex: 1, alignItems: "flex-end" }}>
                        <Text style={{ color: C.ink, fontSize: 14, fontWeight: "900", textAlign: "right" }}>{unit.name}</Text>
                        <Text style={{ color: C.muted, fontSize: 11, marginTop: 4, textAlign: "right" }}>{[unit.manufacturer, unit.type, unit.capacity].filter(Boolean).join(" · ") || "أضف بيانات الجهاز"}</Text>
                      </View>
                      <Text style={{ color: C.muted, fontSize: 19 }}>‹</Text>
                    </View>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.line, marginTop: 12, paddingTop: 10 }}>
                      <Text style={{ color: C.muted, fontSize: 10 }}>{last ? `آخر قراءة · ${formatDate(last.timestamp)}` : "لم تُسجل قراءة بعد"}</Text>
                      <StatusPill label={due ? "صيانة مستحقة" : `${unit.readings.length} قراءة`} tone={due ? "amber" : "green"} />
                    </View>
                  </Pressable>
                );
              })}
              <Pressable onPress={onAddEquipment} style={{ minHeight: 54, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: "#B9C9CD", alignItems: "center", justifyContent: "center" }}><Text style={{ color: C.teal, fontSize: 13, fontWeight: "800" }}>＋ إضافة جهاز جديد</Text></Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </Page>
  );
}

const tabs: { key: DeviceTab; label: string }[] = [
  { key: "overview", label: "نظرة عامة" },
  { key: "readings", label: "القراءات" },
  { key: "maintenance", label: "الصيانة" },
  { key: "compare", label: "المقارنة" },
  { key: "parts", label: "القطع" },
  { key: "photos", label: "الصور" },
];

export function EquipmentScreen({
  equipment,
  villaName,
  tab,
  setTab,
  onBack,
  onEdit,
  onAddReading,
  onAddMaintenance,
  onAddPart,
  onAddPhoto,
  days,
  setDays,
  metric,
  setMetric,
}: {
  equipment: Equipment;
  villaName: string;
  tab: DeviceTab;
  setTab: (tab: DeviceTab) => void;
  onBack: () => void;
  onEdit: () => void;
  onAddReading: () => void;
  onAddMaintenance: () => void;
  onAddPart: () => void;
  onAddPhoto: () => void;
  days: number;
  setDays: (days: number) => void;
  metric: ReadingMetric;
  setMetric: (metric: ReadingMetric) => void;
}) {
  const latest = latestReading(equipment);
  const allReadings = sortReadings(equipment.readings).reverse();
  const due = maintenanceDue(equipment);
  const alerts = readingAlerts(equipment);
  const recent = filteredReadings(equipment, days);
  const infoRows = [
    ["الشركة المصنعة", equipment.manufacturer], ["النوع", equipment.type], ["الموديل", equipment.model],
    ["السعة", equipment.capacity], ["الفريون", equipment.refrigerant], ["رقم الجهاز", equipment.serialNo],
    ["الأمبير المقنن", equipment.ratedAmps ? `${equipment.ratedAmps} A` : ""],
    ["ضغط السحب", equipment.suctionPressure ? `${equipment.suctionPressure} PSI` : ""],
    ["ضغط الطرد", equipment.dischargePressure ? `${equipment.dischargePressure} PSI` : ""],
    ["حرارة الدخول", equipment.inletTemp ? `${equipment.inletTemp} °C` : ""],
    ["حرارة الخروج", equipment.outletTemp ? `${equipment.outletTemp} °C` : ""],
  ].filter((row) => row[1]);

  return (
    <Page>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <Header title={equipment.name} subtitle={`${villaName} · ${equipment.type || "جهاز تكييف"}`} onBack={onBack} actionLabel="تعديل البيانات" onAction={onEdit} />
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: C.navy, borderRadius: 20, padding: 17 }}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(128,219,215,0.17)", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#8BE0DA", fontSize: 23, fontWeight: "900" }}>❄</Text></View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={{ color: C.white, fontSize: 16, fontWeight: "900", textAlign: "right" }}>{equipment.manufacturer || "جهاز تكييف"}{equipment.capacity ? ` · ${equipment.capacity}` : ""}</Text>
                <Text style={{ color: "#B8CDD7", fontSize: 11, marginTop: 4, textAlign: "right" }}>{equipment.model || "أضف الموديل"}{equipment.refrigerant ? ` · ${equipment.refrigerant}` : ""}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 15 }}>
              <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 10, alignItems: "flex-end" }}><Text style={{ color: "#AFC3CE", fontSize: 10 }}>آخر قراءة</Text><Text style={{ color: C.white, fontSize: 12, fontWeight: "800", marginTop: 4 }}>{latest ? formatDate(latest.timestamp) : "غير مسجلة"}</Text></View>
              <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 10, alignItems: "flex-end" }}><Text style={{ color: "#AFC3CE", fontSize: 10 }}>دورية الصيانة</Text><Text style={{ color: C.white, fontSize: 12, fontWeight: "800", marginTop: 4 }}>كل {equipment.maintenanceIntervalDays} يوم</Text></View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row-reverse", gap: 7, paddingVertical: 15 }}>
            {tabs.map((item) => {
              const active = tab === item.key;
              return <Pressable key={item.key} onPress={() => setTab(item.key)} style={{ backgroundColor: active ? C.teal : C.white, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: active ? C.teal : C.line }}><Text style={{ color: active ? C.white : C.muted, fontSize: 11, fontWeight: "800" }}>{item.label}{item.key === "photos" && equipment.photos.length ? ` ${equipment.photos.length}` : ""}</Text></Pressable>;
            })}
          </ScrollView>

          {tab === "overview" ? (
            <View>
              {due || alerts.length > 0 ? (
                <View style={{ gap: 8, marginBottom: 15 }}>
                  {due ? <View style={{ backgroundColor: C.amberBg, borderRadius: 14, padding: 12 }}><Text style={{ color: C.amber, textAlign: "right", fontWeight: "900", fontSize: 12 }}>الصيانة الدورية مستحقة</Text><Text style={{ color: "#94703C", textAlign: "right", fontSize: 11, marginTop: 4 }}>الفترة المضبوطة: كل {equipment.maintenanceIntervalDays} يوم · سجّل الصيانة لتحديث الموعد.</Text></View> : null}
                  {alerts.map((alert) => <View key={alert} style={{ backgroundColor: C.redBg, borderRadius: 14, padding: 12 }}><Text style={{ color: C.red, textAlign: "right", fontWeight: "800", fontSize: 11 }}>{alert}</Text></View>)}
                </View>
              ) : null}
              <SectionTitle title="آخر القياسات" note={latest ? formatDate(latest.timestamp, true) : "ابدأ بأول قراءة أسبوعية"} action="＋ تسجيل قراءة" onAction={onAddReading} />
              {latest ? (
                <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  <StatTile label="الأمبير" value={latest.amps ?? "—"} unit="A" />
                  <StatTile label="ضغط السحب" value={latest.suctionPressure ?? "—"} unit="PSI" />
                  <StatTile label="ضغط الطرد" value={latest.dischargePressure ?? "—"} unit="PSI" />
                  <StatTile label="دخول / خروج" value={`${latest.inletTemp ?? "—"} / ${latest.outletTemp ?? "—"}`} unit="°C" />
                </View>
              ) : <View style={{ marginBottom: 20 }}><EmptyState title="لا توجد قراءات بعد" description="افتح نموذج القراءة السريعة وسجّل الأمبير والضغوط ودرجات الحرارة." /><View style={{ marginTop: 10 }}><PrimaryButton title="＋ قراءة أسبوعية جديدة" onPress={onAddReading} /></View></View>}

              <SectionTitle title="بيانات الجهاز" note={equipment.serialNo ? `رقم الجهاز · ${equipment.serialNo}` : "معلومات التعريف والمواصفات"} />
              <Card>
                {infoRows.length ? infoRows.map(([label, value], index) => (
                  <View key={label} style={{ flexDirection: "row-reverse", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: index === infoRows.length - 1 ? 0 : 1, borderBottomColor: C.line }}><Text style={{ color: C.muted, fontSize: 11 }}>{label}</Text><Text style={{ color: C.ink, fontSize: 12, fontWeight: "800" }}>{value}</Text></View>
                )) : <Text style={{ color: C.muted, textAlign: "right", fontSize: 12 }}>لم تُضف بيانات تعريفية لهذا الجهاز.</Text>}
                {equipment.notes ? <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 11, marginTop: 6 }}><Text style={{ color: C.muted, fontSize: 10, textAlign: "right" }}>ملاحظات</Text><Text style={{ color: C.ink, fontSize: 12, lineHeight: 19, marginTop: 4, textAlign: "right" }}>{equipment.notes}</Text></View> : null}
              </Card>
              <View style={{ marginTop: 20 }}><SectionTitle title="إجراءات سريعة" note="تسجيل ميداني بنقرات أقل" /></View>
              <View style={{ gap: 9 }}>
                <PrimaryButton title="＋ قراءة أسبوعية جديدة" onPress={onAddReading} />
                <View style={{ flexDirection: "row-reverse", gap: 9 }}>
                  <View style={{ flex: 1 }}><PrimaryButton title="＋ سجل صيانة" onPress={onAddMaintenance} secondary /></View>
                  <View style={{ flex: 1 }}><PrimaryButton title="＋ قطعة غيار" onPress={onAddPart} secondary /></View>
                </View>
              </View>
            </View>
          ) : null}

          {tab === "readings" ? (
            <View>
              <SectionTitle title="سجل القراءات" note="مرتبة من الأحدث إلى الأقدم" action="＋ قراءة جديدة" onAction={onAddReading} />
              {allReadings.length ? <View style={{ gap: 9 }}>{allReadings.map((reading) => (
                <Card key={reading.id} style={{ padding: 14 }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><Text style={{ color: C.ink, fontWeight: "900", fontSize: 12 }}>{formatDate(reading.timestamp, true)}</Text><StatusPill label="قراءة فنية" tone="green" /></View>
                  <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 7 }}>
                    {([["الأمبير", reading.amps, "A"], ["ضغط السحب", reading.suctionPressure, "PSI"], ["ضغط الطرد", reading.dischargePressure, "PSI"], ["حرارة الدخول", reading.inletTemp, "°C"], ["حرارة الخروج", reading.outletTemp, "°C"]] as const).filter(([, value]) => typeof value === "number").map(([label, value, unit]) => <View key={label} style={{ backgroundColor: "#F4F7F8", borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8, minWidth: "30%" }}><Text style={{ color: C.muted, fontSize: 9, textAlign: "right" }}>{label}</Text><Text style={{ color: C.ink, fontSize: 12, fontWeight: "900", textAlign: "right", marginTop: 3 }}>{value} {unit}</Text></View>)}
                  </View>
                  {reading.notes ? <Text style={{ color: C.muted, fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 10 }}>{reading.notes}</Text> : null}
                </Card>
              ))}</View> : <EmptyState title="سجل القراءات فارغ" description="أضف القراءة الأسبوعية الأولى للاحتفاظ بالأمبير والضغط ودرجات الحرارة مع التاريخ والوقت." />}
            </View>
          ) : null}

          {tab === "maintenance" ? (
            <View>
              <SectionTitle title="سجل الصيانة" note={`التذكير التالي حسب دورة ${equipment.maintenanceIntervalDays} يوم`} action="＋ إضافة صيانة" onAction={onAddMaintenance} />
              {equipment.maintenance.length ? <View style={{ gap: 9 }}>{[...equipment.maintenance].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).map((entry) => (
                <View key={entry.id} style={{ flexDirection: "row-reverse", gap: 12 }}>
                  <View style={{ width: 34, alignItems: "center" }}><View style={{ width: 12, height: 12, borderRadius: 7, backgroundColor: C.teal, marginTop: 16 }} /><View style={{ width: 1, flex: 1, minHeight: 55, backgroundColor: C.line }} /></View>
                  <Card style={{ flex: 1, padding: 14, marginBottom: 8 }}><View style={{ flexDirection: "row-reverse", justifyContent: "space-between", gap: 8 }}><Text style={{ color: C.ink, fontSize: 13, fontWeight: "900", textAlign: "right", flex: 1 }}>{entry.title}</Text><Text style={{ color: C.teal, fontSize: 10, fontWeight: "800" }}>{formatDate(entry.date)}</Text></View>{entry.details ? <Text style={{ color: C.muted, fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 8 }}>{entry.details}</Text> : null}</Card>
                </View>
              ))}</View> : <EmptyState title="لا يوجد سجل صيانة" description="وثّق تنظيف الفلاتر والمكثف، القياسات، تغيير القطع، أو إضافة الفريون." />}
              <View style={{ marginTop: 12 }}><PrimaryButton title="＋ تسجيل أعمال صيانة" onPress={onAddMaintenance} /></View>
            </View>
          ) : null}

          {tab === "compare" ? (
            <View>
              <SectionTitle title="مقارنة القراءات" note="تابع الاتجاه لكل مؤشر على حدة" />
              <View style={{ flexDirection: "row-reverse", gap: 7, marginBottom: 14 }}>
                {[30, 90, 180].map((value) => <Pressable key={value} onPress={() => setDays(value)} style={{ backgroundColor: days === value ? C.navy : C.white, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: days === value ? C.navy : C.line }}><Text style={{ color: days === value ? C.white : C.muted, fontSize: 11, fontWeight: "800" }}>{value === 30 ? "30 يوم" : value === 90 ? "3 أشهر" : "6 أشهر"}</Text></Pressable>)}
              </View>
              <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 7, marginBottom: 13 }}>
                {(Object.keys(metricLabels) as ReadingMetric[]).map((key) => <Pressable key={key} onPress={() => setMetric(key)} style={{ backgroundColor: metric === key ? C.mint : C.white, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11, borderWidth: 1, borderColor: metric === key ? "#B1E1DB" : C.line }}><Text style={{ color: metric === key ? C.tealDeep : C.muted, fontSize: 10, fontWeight: "800" }}>{metricLabels[key].label}</Text></Pressable>)}
              </View>
              <Card style={{ padding: 15 }}><TrendChart readings={recent} metric={metric} /></Card>
              <View style={{ marginTop: 16 }}><SectionTitle title="ملاحظات المقارنة" note="تُظهر التنبيهات تغيرًا ≥20% أو فرق حرارة ≥4°C" /></View>
              {alerts.length ? <View style={{ gap: 7 }}>{alerts.map((alert) => <View key={alert} style={{ backgroundColor: C.redBg, padding: 12, borderRadius: 13 }}><Text style={{ color: C.red, fontSize: 11, textAlign: "right", fontWeight: "800" }}>{alert}</Text></View>)}</View> : <View style={{ backgroundColor: C.greenBg, padding: 12, borderRadius: 13 }}><Text style={{ color: C.green, fontSize: 11, textAlign: "right", fontWeight: "800" }}>لا يوجد تغيّر غير معتاد بين آخر قراءتين.</Text></View>}
            </View>
          ) : null}

          {tab === "parts" ? (
            <View>
              <SectionTitle title="قطع الغيار" note="سجل التغيير ورقم القطعة" action="＋ إضافة قطعة" onAction={onAddPart} />
              {equipment.parts.length ? <View style={{ gap: 9 }}>{[...equipment.parts].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).map((part) => (
                <Card key={part.id} style={{ padding: 14 }}>
                  <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}><Text style={{ color: C.ink, fontSize: 13, fontWeight: "900" }}>{part.name}</Text><Text style={{ color: C.muted, fontSize: 10 }}>{formatDate(part.date)}</Text></View>
                  {part.partNumber ? <Text style={{ color: C.teal, textAlign: "right", fontSize: 11, fontWeight: "800", marginTop: 8 }}>رقم القطعة · {part.partNumber}</Text> : null}
                  {(part.oldPart || part.newPart) ? <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 9 }}><View style={{ flex: 1, backgroundColor: "#F4F7F8", padding: 9, borderRadius: 11 }}><Text style={{ color: C.muted, textAlign: "right", fontSize: 9 }}>القطعة القديمة</Text><Text style={{ color: C.ink, textAlign: "right", fontSize: 11, fontWeight: "800", marginTop: 3 }}>{part.oldPart || "—"}</Text></View><View style={{ flex: 1, backgroundColor: C.mint, padding: 9, borderRadius: 11 }}><Text style={{ color: C.tealDeep, textAlign: "right", fontSize: 9 }}>القطعة الجديدة</Text><Text style={{ color: C.ink, textAlign: "right", fontSize: 11, fontWeight: "800", marginTop: 3 }}>{part.newPart || "—"}</Text></View></View> : null}
                  {part.notes ? <Text style={{ color: C.muted, fontSize: 11, textAlign: "right", marginTop: 9 }}>{part.notes}</Text> : null}
                  {part.photoUri ? <Image source={{ uri: part.photoUri }} resizeMode="cover" style={{ width: 84, height: 84, borderRadius: 12, marginTop: 10, alignSelf: "flex-end" }} /> : null}
                </Card>
              ))}</View> : <EmptyState title="لا توجد قطع مسجلة" description="سجّل الكابستور أو الكونتاكتور أو الكمبروسر وغيرها مع تاريخ ورقم القطعة." />}
              <View style={{ marginTop: 12 }}><PrimaryButton title="＋ تسجيل قطعة غيار" onPress={onAddPart} /></View>
            </View>
          ) : null}

          {tab === "photos" ? (
            <View>
              <SectionTitle title="صور الجهاز والأعمال" note={`${equipment.photos.length} صورة محفوظة على الجهاز`} action="＋ إضافة صورة" onAction={onAddPhoto} />
              {equipment.photos.length ? <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 9 }}>{[...equipment.photos].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).map((photo) => <View key={photo.id} style={{ width: "48.5%", backgroundColor: C.white, borderRadius: 15, borderWidth: 1, borderColor: C.line, padding: 7 }}><Image source={{ uri: photo.uri }} resizeMode="cover" style={{ width: "100%", aspectRatio: 1.15, borderRadius: 10, backgroundColor: "#E8EEF1" }} /><Text style={{ color: C.ink, fontSize: 11, fontWeight: "800", textAlign: "right", marginTop: 7 }} numberOfLines={1}>{photo.caption || "صورة من سجل الجهاز"}</Text><Text style={{ color: C.muted, fontSize: 9, textAlign: "right", marginTop: 3 }}>{formatDate(photo.date, true)}</Text></View>)}</View> : <EmptyState title="أضف صورًا للموقع أو القطعة" description="احتفظ بصورة لوحة البيانات أو حالة الجهاز أو القطعة المستبدلة للرجوع إليها لاحقًا." />}
              <View style={{ marginTop: 12 }}><PrimaryButton title="＋ اختيار صورة من الجهاز" onPress={onAddPhoto} /></View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Page>
  );
}
