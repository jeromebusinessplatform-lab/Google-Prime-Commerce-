import crypto from "crypto";

export function verifyTelegramInitData(initData: string, botToken: string, maxAgeSeconds: number): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return false;
    
    urlParams.delete("hash");
    const authDate = urlParams.get("auth_date");
    if (!authDate) return false;
    
    const timeAge = Math.floor(Date.now() / 1000) - parseInt(authDate, 10);
    if (timeAge > maxAgeSeconds || timeAge < -60) return false;

    urlParams.sort();
    
    const dataCheckString = Array.from(urlParams.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
      
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const expectedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    
    return crypto.timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(hash, "hex"));
  } catch (err) {
    return false;
  }
}
