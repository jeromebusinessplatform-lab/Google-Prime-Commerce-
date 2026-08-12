import { describe, it, expect } from "vitest";
import { calculateOrderTraffic, calculateAverageDurationMinutes } from "./order-queue.js";

describe("Order Queue Domain", () => {
  it("calculates traffic boundaries", () => {
    expect(calculateOrderTraffic(5)).toBe("LIGHT");
    expect(calculateOrderTraffic(6)).toBe("MODERATE");
    expect(calculateOrderTraffic(10)).toBe("MODERATE");
    expect(calculateOrderTraffic(11)).toBe("HEAVY");
  });

  it("calculates average duration in minutes", () => {
    const now = Date.now();
    const d1 = new Date(now).toISOString();
    const d2 = new Date(now + 60000 * 5).toISOString(); // 5 mins
    const d3 = new Date(now + 60000 * 15).toISOString(); // 15 mins
    
    // (5 + 15) / 2 = 10
    expect(calculateAverageDurationMinutes([d1, d1], [d2, d3])).toBe(10);
  });
  
  it("returns null for empty samples", () => {
    expect(calculateAverageDurationMinutes([], [])).toBeNull();
  });
});
