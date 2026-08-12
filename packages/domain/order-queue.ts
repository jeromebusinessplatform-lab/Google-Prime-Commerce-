export function calculateOrderTraffic(activeLoad: number): "LIGHT" | "MODERATE" | "HEAVY" {
  if (activeLoad <= 5) return "LIGHT";
  if (activeLoad <= 10) return "MODERATE";
  return "HEAVY";
}

export function calculateAverageDurationMinutes(startDates: string[], endDates: string[]): number | null {
  if (startDates.length === 0 || startDates.length !== endDates.length) return null;
  
  let totalMs = 0;
  let count = 0;
  for (let i = 0; i < startDates.length; i++) {
    const s = new Date(startDates[i]).getTime();
    const e = new Date(endDates[i]).getTime();
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      totalMs += (e - s);
      count++;
    }
  }
  
  if (count === 0) return null;
  return Math.round((totalMs / count) / 60000);
}
