export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase().normalize('NFKC');
}

export function validateReferralRules(
  code: string,
  referrerId: string,
  referredId: string,
  isFirstOrder: boolean,
  cartSubtotal: number,
  config: { enabled: boolean, minSpend: number, allowSelfReferral: boolean }
) {
  if (!config.enabled) return { valid: false, reason: "Program disabled" };
  if (!config.allowSelfReferral && referrerId === referredId) return { valid: false, reason: "Self referral not allowed" };
  if (!isFirstOrder) return { valid: false, reason: "Not first order" };
  if (cartSubtotal < config.minSpend) return { valid: false, reason: "Minimum spend not met" };
  
  return { valid: true };
}
