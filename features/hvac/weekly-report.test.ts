import { describe, expect, it } from "vitest";
import { buildWeeklyReportHtml, getWeeklyPeriod } from "./weekly-report";
import type { Equipment, HvacStore } from "./types";

const baseDate = new Date(2026, 9, 3, 12, 0, 0);

const makeEquipment = (overrides: Partial<Equipment> = {}): Equipment => ({
  id: "ac-1",
  villaId: "villa-1",
  name: "تكييف الصالة",
  manufacturer: "Carrier",
  type: "Split",
  model: "X1",
  capacity: "2 طن",
  refrigerant: "R410A",
  serialNo: "",
  ratedAmps: "",
  suctionPressure: "",
  dischargePressure: "",
  inletTemp: "",
  outletTemp: "",
  notes: "",
  maintenanceIntervalDays: 60,
  createdAt: new Date(2026, 8, 1).toISOString(),
  readings: [],
  maintenance: [],
  parts: [],
  photos: [],
  ...overrides,
});

const makeStore = (equipment: Equipment[]): HvacStore => ({
  villas: [{ id: "villa-1", name: "الفيلا الرئيسية", createdAt: new Date(2026, 8, 1).toISOString() }],
  equipment,
});

describe("weekly maintenance report", () => {
  it("uses the current day and six preceding calendar days", () => {
    const { start, end } = getWeeklyPeriod(baseDate);
    expect(start.getDate()).toBe(27);
    expect(start.getHours()).toBe(0);
    expect(end.getDate()).toBe(3);
    expect(end.getHours()).toBe(23);
  });

  it("includes only maintenance and readings within the weekly period", () => {
    const equipment = makeEquipment({
      maintenance: [
        { id: "m1", date: new Date(2026, 9, 2, 10).toISOString(), title: "تنظيف فلتر" },
        { id: "m2", date: new Date(2026, 9, 20, 10).toISOString(), title: "خارج الفترة" },
      ],
      readings: [
        { id: "r1", timestamp: new Date(2026, 9, 1, 10).toISOString(), amps: 8.2, suctionPressure: 118 },
        { id: "r2", timestamp: new Date(2026, 8, 20, 10).toISOString(), amps: 7.9 },
      ],
    });
    const report = buildWeeklyReportHtml(makeStore([equipment]), baseDate);
    expect(report.maintenanceCount).toBe(1);
    expect(report.readingCount).toBe(1);
    expect(report.activeEquipmentCount).toBe(1);
    expect(report.html).toContain("تنظيف فلتر");
    expect(report.html).not.toContain("خارج الفترة");
    expect(report.html).toContain("8.2");
    expect(report.html).not.toContain("7.9");
  });

  it("escapes user-provided names and notes in generated HTML", () => {
    const equipment = makeEquipment({
      name: "<img src=x onerror=alert(1)>",
      readings: [{ id: "r1", timestamp: new Date(2026, 9, 2).toISOString(), amps: 8, notes: "A & B" }],
    });
    const report = buildWeeklyReportHtml(makeStore([equipment]), baseDate);
    expect(report.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(report.html).toContain("A &amp; B");
    expect(report.html).not.toContain("<img src=x");
  });
});
