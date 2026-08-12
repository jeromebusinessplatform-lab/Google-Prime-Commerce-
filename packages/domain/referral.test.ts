import { describe, it, expect } from "vitest";
import { normalizeReferralCode, validateReferralRules } from "./referral.js";

describe("Referral Domain", () => {
  it("normalizes codes", () => {
    expect(normalizeReferralCode(" aBc ")).toBe("ABC");
  });

  it("rejects self referral", () => {
    const res = validateReferralRules("CODE", "u1", "u1", true, 1000, { enabled: true, minSpend: 0, allowSelfReferral: false });
    expect(res.valid).toBe(false);
  });
  
  it("rejects non-first order", () => {
    const res = validateReferralRules("CODE", "u1", "u2", false, 1000, { enabled: true, minSpend: 0, allowSelfReferral: false });
    expect(res.valid).toBe(false);
  });
});
