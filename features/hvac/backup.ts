import type { HvacStore } from "./types";

export const BACKUP_FORMAT = "miqyas-hvac-backup";
export const BACKUP_VERSION = 1;
const MEDIA_MARKER = "miqyas-backup-media://";
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export type BackupMedia = {
  key: string;
  mimeType: string;
  base64: string;
};

export type HvacBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  createdAt: string;
  store: HvacStore;
  media: BackupMedia[];
};

export type BackupMediaReader = (uri: string) => Promise<{ base64: string; mimeType?: string }>;
export type BackupMediaWriter = (media: BackupMedia, index: number) => Promise<string>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function cloneStore(store: HvacStore): HvacStore {
  return JSON.parse(JSON.stringify(store)) as HvacStore;
}

function markerFor(key: string): string {
  return `${MEDIA_MARKER}${key}`;
}

function mimeTypeFor(uri: string): string {
  const extension = uri.split(/[?#]/, 1)[0]?.split(".").pop()?.toLowerCase();
  const known: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
  };
  return extension ? known[extension] ?? "image/jpeg" : "image/jpeg";
}

function mimeFromDataUri(uri: string): { mimeType: string; base64: string } | undefined {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/s.exec(uri);
  if (!match) return undefined;
  return { mimeType: match[1].toLowerCase(), base64: match[2].replace(/\s/g, "") };
}

function isBase64(value: string): boolean {
  return value.length > 0
    && value.length % 4 === 0
    && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
}

export async function createBackupPayload(
  originalStore: HvacStore,
  readImage: BackupMediaReader,
  createdAt = new Date().toISOString(),
): Promise<HvacBackup> {
  const store = cloneStore(originalStore);
  const media: BackupMedia[] = [];
  let nextIndex = 0;

  for (const equipment of store.equipment) {
    for (const photo of equipment.photos) {
      if (!photo.uri) continue;
      const key = `image-${nextIndex++}`;
      const embedded = mimeFromDataUri(photo.uri);
      const result = embedded ?? await readImage(photo.uri);
      const mimeType = (embedded?.mimeType ?? result.mimeType ?? mimeTypeFor(photo.uri)).toLowerCase();
      if (!SUPPORTED_IMAGE_TYPES.has(mimeType) || !isBase64(result.base64)) {
        throw new Error(`تعذّر تضمين صورة الجهاز ${equipment.name} في النسخة الاحتياطية.`);
      }
      media.push({ key, mimeType, base64: result.base64.replace(/\s/g, "") });
      photo.uri = markerFor(key);
    }

    for (const part of equipment.parts) {
      if (!part.photoUri) continue;
      const key = `image-${nextIndex++}`;
      const embedded = mimeFromDataUri(part.photoUri);
      const result = embedded ?? await readImage(part.photoUri);
      const mimeType = (embedded?.mimeType ?? result.mimeType ?? mimeTypeFor(part.photoUri)).toLowerCase();
      if (!SUPPORTED_IMAGE_TYPES.has(mimeType) || !isBase64(result.base64)) {
        throw new Error(`تعذّر تضمين صورة قطعة الغيار ${part.name} في النسخة الاحتياطية.`);
      }
      media.push({ key, mimeType, base64: result.base64.replace(/\s/g, "") });
      part.photoUri = markerFor(key);
    }
  }

  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt, store, media };
}

export function validateBackup(value: unknown): asserts value is HvacBackup {
  if (!isRecord(value) || value.format !== BACKUP_FORMAT || value.version !== BACKUP_VERSION) {
    throw new Error("هذا الملف ليس نسخة احتياطية صالحة من مِقياس أو أن إصداره غير مدعوم.");
  }
  if (typeof value.createdAt !== "string" || !isRecord(value.store)
    || !Array.isArray(value.store.villas) || !Array.isArray(value.store.equipment)
    || !Array.isArray(value.media)) {
    throw new Error("ملف النسخة الاحتياطية ناقص أو تالف.");
  }

  for (const villa of value.store.villas) {
    if (!isRecord(villa) || typeof villa.id !== "string" || typeof villa.name !== "string") {
      throw new Error("تحتوي النسخة الاحتياطية على بيانات فيلا غير مكتملة.");
    }
  }

  const mediaByKey = new Map<string, BackupMedia>();
  for (const item of value.media) {
    if (!isRecord(item) || typeof item.key !== "string" || !/^image-\d+$/.test(item.key)
      || typeof item.mimeType !== "string" || !SUPPORTED_IMAGE_TYPES.has(item.mimeType)
      || typeof item.base64 !== "string" || !isBase64(item.base64) || mediaByKey.has(item.key)) {
      throw new Error("تحتوي النسخة الاحتياطية على صورة غير سليمة.");
    }
    mediaByKey.set(item.key, item as BackupMedia);
  }

  for (const equipment of value.store.equipment) {
    if (!isRecord(equipment) || typeof equipment.id !== "string" || typeof equipment.villaId !== "string"
      || typeof equipment.name !== "string" || !Array.isArray(equipment.readings)
      || !Array.isArray(equipment.maintenance) || !Array.isArray(equipment.parts)
      || !Array.isArray(equipment.photos)) {
      throw new Error("تحتوي النسخة الاحتياطية على بيانات جهاز غير مكتملة.");
    }
    for (const photo of equipment.photos) {
      if (!isRecord(photo) || typeof photo.id !== "string" || typeof photo.uri !== "string") {
        throw new Error("تحتوي النسخة الاحتياطية على سجل صورة غير مكتمل.");
      }
      if (!photo.uri.startsWith(MEDIA_MARKER) || !mediaByKey.has(photo.uri.slice(MEDIA_MARKER.length))) {
        throw new Error("إحدى صور الأجهزة مفقودة من ملف النسخة الاحتياطية.");
      }
    }
    for (const part of equipment.parts) {
      if (!isRecord(part) || typeof part.id !== "string" || typeof part.name !== "string") {
        throw new Error("تحتوي النسخة الاحتياطية على سجل قطعة غيار غير مكتمل.");
      }
      if (part.photoUri !== undefined && part.photoUri !== null) {
        if (typeof part.photoUri !== "string" || !part.photoUri.startsWith(MEDIA_MARKER)
          || !mediaByKey.has(part.photoUri.slice(MEDIA_MARKER.length))) {
          throw new Error("إحدى صور قطع الغيار مفقودة من ملف النسخة الاحتياطية.");
        }
      }
    }
  }
}

export async function restoreBackupPayload(value: unknown, writeImage: BackupMediaWriter): Promise<HvacStore> {
  validateBackup(value);
  const store = cloneStore(value.store);
  const mediaByKey = new Map(value.media.map((item) => [item.key, item]));
  const restoredUris = new Map<string, string>();
  let nextIndex = 0;

  const restoreUri = async (uri: string): Promise<string> => {
    const key = uri.slice(MEDIA_MARKER.length);
    const existing = restoredUris.get(key);
    if (existing) return existing;
    const media = mediaByKey.get(key);
    if (!media) throw new Error("إحدى صور النسخة الاحتياطية غير موجودة.");
    const restored = await writeImage(media, nextIndex++);
    restoredUris.set(key, restored);
    return restored;
  };

  for (const equipment of store.equipment) {
    for (const photo of equipment.photos) photo.uri = await restoreUri(photo.uri);
    for (const part of equipment.parts) {
      if (part.photoUri) part.photoUri = await restoreUri(part.photoUri);
    }
  }
  return store;
}

export function backupFilename(date = new Date()): string {
  const stamp = date.toISOString().replace(/[:.]/g, "-");
  return `miqyas-backup-${stamp}.json`;
}
