export type DeviceStatus = "allowed" | "pending" | "blocked";
export type DeviceKind = "phone" | "laptop" | "other";

export type NetworkDevice = {
  id: string;
  name: string;
  ip: string;
  mac: string;
  kind: DeviceKind;
  status: DeviceStatus;
  speedPolicy?: { downloadKbps: number; uploadKbps: number };
};

export type RouterCapabilities = {
  connectedClients: "supported" | "unknown" | "unsupported";
  macFiltering: "supported" | "unknown" | "unsupported";
  perDeviceSpeedLimit: "supported" | "unknown" | "unsupported";
  qosPriority: "supported" | "unknown" | "unsupported";
};

export type RouterResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: "not_connected" | "unsupported" | "unauthorized" | "network_error"; message: string };

export interface RouterAdapter {
  readonly model: string;
  discoverCapabilities(): Promise<RouterResult<RouterCapabilities>>;
  listConnectedDevices(): Promise<RouterResult<NetworkDevice[]>>;
  setDeviceAccess(device: NetworkDevice, status: Extract<DeviceStatus, "allowed" | "blocked">): Promise<RouterResult<void>>;
  setDeviceSpeed(device: NetworkDevice, downloadKbps: number, uploadKbps: number): Promise<RouterResult<void>>;
}

/**
 * Boundary for the real H168N firmware integration. The exact endpoints and
 * session flow vary by ISP firmware, so no network command is guessed here.
 */
export class ZteH168nAdapter implements RouterAdapter {
  readonly model = "ZTE ZXHN H168N";

  constructor(private readonly baseUrl: string) {}

  async discoverCapabilities(): Promise<RouterResult<RouterCapabilities>> {
    return { ok: false, code: "unsupported", message: `لم يتم ربط واجهة firmware للعنوان ${this.baseUrl} بعد.` };
  }

  async listConnectedDevices(): Promise<RouterResult<NetworkDevice[]>> {
    return { ok: false, code: "unsupported", message: "قائمة العملاء تحتاج تحديد إصدار firmware وطريقة تسجيل الدخول الفعلية." };
  }

  async setDeviceAccess(_device: NetworkDevice, _status: Extract<DeviceStatus, "allowed" | "blocked">): Promise<RouterResult<void>> {
    return { ok: false, code: "unsupported", message: "MAC Filtering غير مؤكد في هذا الإصدار من الراوتر." };
  }

  async setDeviceSpeed(_device: NetworkDevice, _downloadKbps: number, _uploadKbps: number): Promise<RouterResult<void>> {
    return { ok: false, code: "unsupported", message: "الحد الفردي للسرعة غير مؤكد؛ قد يتوفر QoS كأولوية مرور فقط." };
  }
}

/**
 * Opt-in dataset used only to exercise the UI before connecting to a physical
 * router. The interface labels this mode as preview in the screen.
 */
export function createPreviewDevices(): NetworkDevice[] {
  return [
    { id: "preview-phone", name: "هاتف العائلة", ip: "192.168.1.12", mac: "A4:6B:7C:91:20:EF", kind: "phone", status: "allowed" },
    { id: "preview-laptop", name: "اللابتوب", ip: "192.168.1.18", mac: "7C:10:C9:44:82:11", kind: "laptop", status: "pending" },
    { id: "preview-tv", name: "تلفزيون الصالة", ip: "192.168.1.23", mac: "D8:3A:DD:08:5B:70", kind: "other", status: "blocked" },
  ];
}
