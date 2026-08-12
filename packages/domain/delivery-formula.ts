export interface CourierFeeConfig {
  baseDistanceKm: number;
  baseFareMinor: number;
  excessPerKmMinor: number;
  platformFeeMinor: number;
  perKmSurchargeMinor: number;
  nightFeeMinor: number;
  nightFeeStartHour?: number;
  nightFeeEndHour?: number;
}

export function calculateDeliveryFee(
  routeDistanceMeters: number,
  config: CourierFeeConfig,
  isNight: boolean
): {
  baseFareMinor: number;
  excessChargeMinor: number;
  platformFeeMinor: number;
  distanceSurchargeMinor: number;
  nightFeeMinor: number;
  totalMinor: number;
} {
  const roadDistanceKm = routeDistanceMeters / 1000;
  const excessDistanceKm = Math.max(0, roadDistanceKm - config.baseDistanceKm);

  const excessChargeMinor = Math.round(excessDistanceKm * config.excessPerKmMinor);
  const distanceSurchargeMinor = Math.round(roadDistanceKm * config.perKmSurchargeMinor);
  
  const nightFeeMinor = isNight ? config.nightFeeMinor : 0;
  const platformFeeMinor = config.platformFeeMinor;
  const baseFareMinor = config.baseFareMinor;

  const totalMinor = baseFareMinor + excessChargeMinor + platformFeeMinor + distanceSurchargeMinor + nightFeeMinor;

  return {
    baseFareMinor,
    excessChargeMinor,
    platformFeeMinor,
    distanceSurchargeMinor,
    nightFeeMinor,
    totalMinor
  };
}
