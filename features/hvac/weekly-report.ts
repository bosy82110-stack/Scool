import type { Equipment, HvacStore, Reading, ReadingMetric } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getWeeklyPeriod(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value: string | Date, includeTime = false): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat("ar-EG", includeTime
    ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function inPeriod(value: string, start: Date, end: Date): boolean {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp >= start.getTime() && timestamp <= end.getTime();
}

const metrics: { key: ReadingMetric; label: string; unit: string }[] = [
  { key: "amps", label: "الأمبير", unit: "A" },
  { key: "suctionPressure", label: "ضغط السحب", unit: "PSI" },
  { key: "dischargePressure", label: "ضغط الطرد", unit: "PSI" },
  { key: "inletTemp", label: "حرارة الدخول", unit: "°C" },
  { key: "outletTemp", label: "حرارة الخروج", unit: "°C" },
];

type MaintenanceRow = {
  equipment: Equipment;
  villaName: string;
  date: string;
  title: string;
  details?: string;
};

type ReadingRow = {
  equipment: Equipment;
  villaName: string;
  reading: Reading;
};

export function buildWeeklyReportHtml(store: HvacStore, now = new Date()) {
  const { start, end } = getWeeklyPeriod(now);
  const villaNames = new Map(store.villas.map((villa) => [villa.id, villa.name]));
  const maintenanceRows: MaintenanceRow[] = [];
  const readingRows: ReadingRow[] = [];

  store.equipment.forEach((equipment) => {
    const villaName = villaNames.get(equipment.villaId) ?? "موقع غير محدد";
    equipment.maintenance.forEach((entry) => {
      if (inPeriod(entry.date, start, end)) {
        maintenanceRows.push({ equipment, villaName, ...entry });
      }
    });
    equipment.readings.forEach((reading) => {
      if (inPeriod(reading.timestamp, start, end)) {
        readingRows.push({ equipment, villaName, reading });
      }
    });
  });

  maintenanceRows.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  readingRows.sort((a, b) => Date.parse(b.reading.timestamp) - Date.parse(a.reading.timestamp));
  const activeEquipmentIds = new Set([
    ...maintenanceRows.map((row) => row.equipment.id),
    ...readingRows.map((row) => row.equipment.id),
  ]);
  const maintenanceHtml = maintenanceRows.length
    ? maintenanceRows.map((row) => `
      <article class="entry">
        <div class="entry-heading"><h3>${escapeHtml(row.title)}</h3><span class="date">${formatDate(row.date, true)}</span></div>
        <p class="location">${escapeHtml(row.villaName)} <span>←</span> ${escapeHtml(row.equipment.name)}</p>
        ${row.details ? `<p class="details">${escapeHtml(row.details)}</p>` : ""}
      </article>`).join("")
    : `<div class="empty">لا توجد أعمال صيانة مسجلة خلال هذه الفترة.</div>`;

  const readingsHtml = readingRows.length
    ? readingRows.map(({ equipment, villaName, reading }) => {
      const valuesHtml = metrics
        .filter(({ key }) => typeof reading[key] === "number")
        .map(({ key, label, unit }) => `<div class="metric"><span>${label}</span><strong>${escapeHtml(reading[key])}<small>${unit}</small></strong></div>`)
        .join("");
      return `
        <article class="entry reading-entry">
          <div class="entry-heading"><h3>${escapeHtml(equipment.name)}</h3><span class="date">${formatDate(reading.timestamp, true)}</span></div>
          <p class="location">${escapeHtml(villaName)}${equipment.manufacturer ? ` · ${escapeHtml(equipment.manufacturer)}` : ""}</p>
          <div class="metrics">${valuesHtml || `<p class="details">لا توجد قياسات رقمية في هذا السجل.</p>`}</div>
          ${reading.notes ? `<p class="details"><b>ملاحظات الفني:</b> ${escapeHtml(reading.notes)}</p>` : ""}
        </article>`;
    }).join("")
    : `<div class="empty">لا توجد قراءات مسجلة خلال هذه الفترة.</div>`;

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>تقرير الصيانة الأسبوعي</title>
<style>
  @page { size: A4; margin: 14mm 13mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #10283F; background: #fff; font-family: Arial, Tahoma, sans-serif; font-size: 12px; line-height: 1.65; }
  .topline { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #087E8B; padding-bottom: 12px; margin-bottom: 18px; }
  .brand { color: #087E8B; font-weight: 900; font-size: 15px; }
  .confidential { color: #718092; font-size: 10px; }
  h1 { margin: 0; font-size: 23px; }
  .period { margin: 5px 0 16px; color: #718092; font-size: 12px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 14px 0 22px; }
  .summary-item { border: 1px solid #E5ECEF; border-radius: 10px; background: #F6F9FA; padding: 10px; text-align: center; }
  .summary-item strong { display: block; font-size: 20px; color: #087E8B; }
  .summary-item span { color: #718092; font-size: 10px; }
  h2 { font-size: 16px; margin: 20px 0 10px; padding-right: 9px; border-right: 3px solid #087E8B; }
  .entry { border: 1px solid #E5ECEF; border-radius: 10px; padding: 11px 13px; margin: 8px 0; page-break-inside: avoid; }
  .entry-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .entry h3 { margin: 0; font-size: 13px; }
  .date { color: #718092; font-size: 10px; white-space: nowrap; }
  .location { color: #087E8B; font-size: 10px; margin: 3px 0 0; }
  .details { color: #425567; margin: 8px 0 0; white-space: pre-wrap; }
  .metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 10px; }
  .metric { border-radius: 7px; background: #F3F6F7; padding: 6px; text-align: center; }
  .metric span { display: block; color: #718092; font-size: 9px; }
  .metric strong { display: block; font-size: 12px; }
  .metric small { color: #087E8B; font-size: 9px; margin-right: 3px; }
  .empty { border: 1px dashed #C9D5DA; border-radius: 9px; padding: 13px; color: #718092; text-align: center; }
  .footer { margin-top: 22px; border-top: 1px solid #E5ECEF; padding-top: 9px; color: #718092; font-size: 9px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="topline"><span class="brand">مِقياس · سجل التكييف</span><span class="confidential">تقرير للإدارة</span></div>
  <h1>تقرير الصيانة الأسبوعي</h1>
  <p class="period">الفترة: ${formatDate(start)} — ${formatDate(end)}</p>
  <div class="summary">
    <div class="summary-item"><strong>${store.villas.length}</strong><span>الفلل والمباني</span></div>
    <div class="summary-item"><strong>${store.equipment.length}</strong><span>إجمالي الأجهزة</span></div>
    <div class="summary-item"><strong>${maintenanceRows.length}</strong><span>أعمال الصيانة</span></div>
    <div class="summary-item"><strong>${readingRows.length}</strong><span>القراءات المسجلة</span></div>
  </div>
  <h2>أعمال الصيانة المنفذة</h2>
  ${maintenanceHtml}
  <h2>قراءات أجهزة التكييف</h2>
  ${readingsHtml}
  <div class="footer"><span>تم إنشاء التقرير من تطبيق مِقياس</span><span>تاريخ الإنشاء: ${formatDate(now, true)}</span></div>
</body>
</html>`;

  return {
    html,
    start,
    end,
    maintenanceCount: maintenanceRows.length,
    readingCount: readingRows.length,
    activeEquipmentCount: activeEquipmentIds.size,
  };
}
