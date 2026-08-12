import { describe, it, expect } from "vitest";
import { calculateDeliveryFee, CourierFeeConfig } from "./delivery-formula.js";

describe("Delivery Fee Calculator", () => {
  const config: CourierFeeConfig = {
    baseDistanceKm: 3.5,
    baseFareMinor: 5000, // 50.00
    excessPerKmMinor: 1000, // 10.00
    platformFeeMinor: 500, // 5.00
    perKmSurchargeMinor: 0,
    nightFeeMinor: 2000, // 20.00
  };

  it("calculates at 0 km", () => {
    const res = calculateDeliveryFee(0, config, false);
    expect(res.totalMinor).toBe(5500); // base + platform
  });

  it("calculates exactly at base distance", () => {
    const res = calculateDeliveryFee(3500, config, false);
    expect(res.totalMinor).toBe(5500);
  });

  it("calculates fractional excess", () => {
    const res = calculateDeliveryFee(4000, config, false);
    // excess is 0.5 km * 1000 = 500
    expect(res.totalMinor).toBe(6000);
  });

  it("calculates with night fee", () => {
    const res = calculateDeliveryFee(3500, config, true);
    expect(res.totalMinor).toBe(7500); // 5500 + 2000
  });
  
  it("calculates with per-km surcharge", () => {
    const c = { ...config, perKmSurchargeMinor: 200 };
    const res = calculateDeliveryFee(10000, c, false);
    // 10km. 3.5 base. 6.5 excess -> 6500. 10km * 200 = 2000 surcharge.
    // 5000 + 6500 + 500 + 2000 = 14000
    expect(res.totalMinor).toBe(14000);
  });
});
