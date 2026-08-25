import { describe, expect, it } from "vitest";

import { createPreviewDevices, type DeviceStatus } from "../lib/router-adapter";

describe("router adapter preview contract", () => {
  it("returns devices with stable identifiers and valid statuses", () => {
    const devices = createPreviewDevices();
    const statuses: DeviceStatus[] = ["allowed", "pending", "blocked"];

    expect(devices.length).toBeGreaterThan(0);
    expect(new Set(devices.map((device) => device.id)).size).toBe(devices.length);
    expect(devices.every((device) => statuses.includes(device.status))).toBe(true);
    expect(devices.every((device) => device.mac.includes(":"))).toBe(true);
  });

  it("contains a pending request for the approval flow", () => {
    expect(createPreviewDevices().some((device) => device.status === "pending")).toBe(true);
  });
});
