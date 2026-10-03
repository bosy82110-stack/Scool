import { describe, expect, it } from "vitest";
import { backupFilename, createBackupPayload, restoreBackupPayload, validateBackup } from "./backup";
import type { HvacStore } from "./types";

const store: HvacStore = {
  villas: [{ id: "villa-1", name: "الفيلا الرئيسية", createdAt: "2026-10-01T09:00:00.000Z" }],
  equipment: [{
    id: "ac-1",
    villaId: "villa-1",
    name: "تكييف الصالة",
    manufacturer: "Carrier",
    type: "Split",
    model: "X1",
    capacity: "2 طن",
    refrigerant: "R410A",
    serialNo: "S123",
    ratedAmps: "8",
    suctionPressure: "118",
    dischargePressure: "365",
    inletTemp: "27",
    outletTemp: "14",
    notes: "يعمل جيداً",
    maintenanceIntervalDays: 60,
    createdAt: "2026-10-01T09:00:00.000Z",
    readings: [{ id: "read-1", timestamp: "2026-10-02T09:00:00.000Z", amps: 8.2, notes: "قراءة سليمة" }],
    maintenance: [{ id: "maint-1", date: "2026-10-02T09:00:00.000Z", title: "تنظيف الفلتر" }],
    parts: [{ id: "part-1", date: "2026-10-02T09:00:00.000Z", name: "Capacitor", photoUri: "content://parts/capacitor.jpg" }],
    photos: [{ id: "photo-1", uri: "file:///pictures/ac.jpg", caption: "ملصق الجهاز", date: "2026-10-02T09:00:00.000Z" }],
  }],
};

const readImage = async (uri: string) => ({
  base64: uri.includes("capacitor") ? "Q0FQ" : "UEhP",
  mimeType: "image/jpeg",
});

describe("Miqyas backup and restore", () => {
  it("backs up every record and embeds equipment and spare-part photos", async () => {
    const backup = await createBackupPayload(store, readImage, "2026-10-03T10:00:00.000Z");
    expect(backup.format).toBe("miqyas-hvac-backup");
    expect(backup.version).toBe(1);
    expect(backup.store.villas[0].name).toBe("الفيلا الرئيسية");
    expect(backup.store.equipment[0].readings[0].amps).toBe(8.2);
    expect(backup.store.equipment[0].maintenance[0].title).toBe("تنظيف الفلتر");
    expect(backup.store.equipment[0].photos[0].uri).toBe("miqyas-backup-media://image-0");
    expect(backup.store.equipment[0].parts[0].photoUri).toBe("miqyas-backup-media://image-1");
    expect(backup.media).toHaveLength(2);
    expect(store.equipment[0].photos[0].uri).toBe("file:///pictures/ac.jpg");
    expect(() => validateBackup(backup)).not.toThrow();
  });

  it("restores embedded photos into durable new URIs without losing data", async () => {
    const backup = await createBackupPayload(store, readImage);
    const restoredPaths: string[] = [];
    const restored = await restoreBackupPayload(backup, async (media, index) => {
      const path = `file:///documents/restore/image-${index}.jpg`;
      restoredPaths.push(`${path}:${media.base64}`);
      return path;
    });
    expect(restored.villas).toEqual(store.villas);
    expect(restored.equipment[0].readings).toEqual(store.equipment[0].readings);
    expect(restored.equipment[0].maintenance).toEqual(store.equipment[0].maintenance);
    expect(restored.equipment[0].photos[0].uri).toBe("file:///documents/restore/image-0.jpg");
    expect(restored.equipment[0].parts[0].photoUri).toBe("file:///documents/restore/image-1.jpg");
    expect(restoredPaths).toHaveLength(2);
  });

  it("rejects damaged or incompatible files and refuses missing photo data", async () => {
    expect(() => validateBackup({ version: 1 })).toThrow("نسخة احتياطية");
    const backup = await createBackupPayload(store, readImage);
    const noPhoto = JSON.parse(JSON.stringify(backup)) as { media: unknown[]; store: HvacStore };
    noPhoto.media = [];
    expect(() => validateBackup(noPhoto)).toThrow("مفقودة");
  });

  it("supports a valid empty backup", async () => {
    const empty = await createBackupPayload({ villas: [], equipment: [] }, readImage);
    expect(empty.media).toEqual([]);
    const restored = await restoreBackupPayload(empty, async () => "unused");
    expect(restored).toEqual({ villas: [], equipment: [] });
  });

  it("adds a timestamp to avoid collisions between backups created the same day", () => {
    expect(backupFilename(new Date("2026-10-03T08:12:03.456Z")))
      .toBe("miqyas-backup-2026-10-03T08-12-03-456Z.json");
  });
});
