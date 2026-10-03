import type { Equipment, Reading, ReadingMetric } from "./types";

export const metricLabels: Record<ReadingMetric, { label: string; short: string; unit: string }> = {
  amps: { label: "الأمبير", short: "A", unit: "A" },
  suctionPressure: { label: "ضغط السحب", short: "منخفض", unit: "PSI" },
  dischargePressure: { label: "ضغط الطرد", short: "مرتفع", unit: "PSI" },
  inletTemp: { label: "حرارة الدخول", short: "دخول", unit: "°C" },
  outletTemp: { label: "حرارة الخروج", short: "خروج", unit: "°C" },
};

export function sortReadings(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

export function latestReading(equipment: Equipment): Reading | undefined {
  return sortReadings(equipment.readings).at(-1);
}

export function readingAlerts(equipment: Equipment): string[] {
  const readings = sortReadings(equipment.readings);
  if (readings.length < 2) return [];
  const previous = readings[readings.length - 2];
  const latest = readings[readings.length - 1];
  const alerts: string[] = [];
  const labels: Record<ReadingMetric, string> = {
    amps: "الأمبير",
    suctionPressure: "ضغط السحب",
    dischargePressure: "ضغط الطرد",
    inletTemp: "حرارة الدخول",
    outletTemp: "حرارة الخروج",
  };
  (Object.keys(labels) as ReadingMetric[]).forEach((key) => {
    const current = latest[key];
    const before = previous[key];
    if (typeof current !== "number" || typeof before !== "number") return;
    const changed = key === "inletTemp" || key === "outletTemp"
      ? Math.abs(current - before) >= 4
      : before !== 0 && Math.abs((current - before) / Math.abs(before)) >= 0.2;
    if (changed) alerts.push(`${labels[key]} تغيّر من ${before} إلى ${current} ${metricLabels[key].unit}`);
  });
  return alerts;
}

export function maintenanceDue(equipment: Equipment, now = Date.now()): boolean {
  const lastService = [...equipment.maintenance].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).at(-1);
  const baseDate = lastService?.date ?? equipment.createdAt;
  const interval = Math.max(1, equipment.maintenanceIntervalDays || 60);
  return now >= Date.parse(baseDate) + interval * 24 * 60 * 60 * 1000;
}

export function filteredReadings(equipment: Equipment, days: number, now = Date.now()): Reading[] {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return sortReadings(equipment.readings).filter((item) => Date.parse(item.timestamp) >= cutoff);
}

export function formatDate(value: string, includeTime = false): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ar-EG", includeTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" });
}
