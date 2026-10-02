export type Villa = {
  id: string;
  name: string;
  createdAt: string;
};

export type Reading = {
  id: string;
  timestamp: string;
  amps?: number;
  suctionPressure?: number;
  dischargePressure?: number;
  inletTemp?: number;
  outletTemp?: number;
  notes?: string;
};

export type MaintenanceEntry = {
  id: string;
  date: string;
  title: string;
  details?: string;
};

export type SparePart = {
  id: string;
  date: string;
  name: string;
  oldPart?: string;
  newPart?: string;
  partNumber?: string;
  notes?: string;
  photoUri?: string;
};

export type EquipmentPhoto = {
  id: string;
  uri: string;
  caption?: string;
  date: string;
};

export type Equipment = {
  id: string;
  villaId: string;
  name: string;
  manufacturer: string;
  type: string;
  model: string;
  capacity: string;
  refrigerant: string;
  serialNo: string;
  ratedAmps: string;
  suctionPressure: string;
  dischargePressure: string;
  inletTemp: string;
  outletTemp: string;
  notes: string;
  maintenanceIntervalDays: number;
  createdAt: string;
  readings: Reading[];
  maintenance: MaintenanceEntry[];
  parts: SparePart[];
  photos: EquipmentPhoto[];
};

export type HvacStore = {
  villas: Villa[];
  equipment: Equipment[];
};

export type ReadingMetric = Exclude<keyof Reading, "id" | "timestamp" | "notes">;
