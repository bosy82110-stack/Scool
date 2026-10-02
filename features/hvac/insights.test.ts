import { describe, expect, it } from "vitest";
import { filteredReadings, maintenanceDue, readingAlerts } from "./insights";
import type { Equipment, Reading } from "./types";

const baseEquipment: Equipment = {
  id: "unit-1",
  villaId: "villa-1",
  name: "غرفة 1",
  manufacturer: "Carrier",
  type: "Split",
  model: "X1",
  capacity: "2 طن",
  refrigerant: "R410A",
  serialNo: "S-1",
  ratedAmps: "12",
  suctionPressure: "118",
  dischargePressure: "365",
  inletTemp: "27",
  outletTemp: "14",
  notes: "",
  maintenanceIntervalDays: 60,
  createdAt: "2026-01-01T00:00:00.000Z",
  readings: [],
  maintenance: [],
  parts: [],
  photos: [],
};

const reading = (id: string, timestamp: string, amps: number, inletTemp = 27): Reading => ({
  id,
  timestamp,
  amps,
  suctionPressure: 118,
  dischargePressure: 365,
  inletTemp,
  outletTemp: 14,
});

describe("HVAC readings and service insights", () => {
  it("flags a current or temperature shift against the prior reading", () => {
    const unit = { ...baseEquipment, readings: [
      reading("old", "2026-01-01T00:00:00.000Z", 8.2, 27),
      reading("new", "2026-01-08T00:00:00.000Z", 10.2, 32),
    ] };
    const alerts = readingAlerts(unit);
    expect(alerts).toContain("الأمبير تغيّر من 8.2 إلى 10.2 A");
    expect(alerts).toContain("حرارة الدخول تغيّر من 27 إلى 32 °C");
  });

  it("does not flag an ordinary change or a single reading", () => {
    expect(readingAlerts({ ...baseEquipment, readings: [reading("one", "2026-01-01T00:00:00.000Z", 8)] })).toEqual([]);
    expect(readingAlerts({ ...baseEquipment, readings: [
      reading("a", "2026-01-01T00:00:00.000Z", 8),
      reading("b", "2026-01-08T00:00:00.000Z", 9),
    ] })).toEqual([]);
  });

  it("uses the latest service date and configured day interval", () => {
    const now = Date.parse("2026-03-15T00:00:00.000Z");
    expect(maintenanceDue(baseEquipment, now)).toBe(true);
    expect(maintenanceDue({ ...baseEquipment, maintenance: [{ id: "m1", date: "2026-03-01T00:00:00.000Z", title: "تنظيف" }] }, now)).toBe(false);
  });

  it("filters chart readings to the selected time window", () => {
    const unit = { ...baseEquipment, readings: [
      reading("old", "2025-12-01T00:00:00.000Z", 8),
      reading("recent", "2026-03-01T00:00:00.000Z", 9),
    ] };
    expect(filteredReadings(unit, 30, Date.parse("2026-03-15T00:00:00.000Z")).map((item) => item.id)).toEqual(["recent"]);
  });
});
