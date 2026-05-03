export type ChemicalReadings = {
  freeChlorine: string;
  ph: string;
  alkalinity: string;
  calciumHardness: string;
  cyanuricAcid: string;
  temperature?: string;
};

export type TreatmentRecommendation = {
  id: string;
  name: string;
  recommendedAmount: number;
  unit: 'ml' | 'g' | 'L';
  reason: string;
};

function parseReading(value: string) {
  if (!value.trim()) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function calcDrainLitres(volumeLitres: number | undefined, current: number, target: number): number {
  if (!volumeLitres || volumeLitres <= 0) return 0;
  const raw = volumeLitres * (1 - target / current);
  return Math.max(0, Math.round(raw / 500) * 500);
}

export function buildRecommendedTreatments(readings: ChemicalReadings, volumeLitres?: number, spa = false): TreatmentRecommendation[] {
  const output: TreatmentRecommendation[] = [];
  const cl = parseReading(readings.freeChlorine);
  const ph = parseReading(readings.ph);
  const alk = parseReading(readings.alkalinity);
  const calcium = parseReading(readings.calciumHardness);
  const cya = spa ? null : parseReading(readings.cyanuricAcid);

  const clLow = spa ? 3 : 1;
  const clHigh = spa ? 5 : 3;
  const phHigh = spa ? 7.8 : 7.6;
  const caLow = spa ? 150 : 200;
  const caHigh = spa ? 250 : 400;
  const caTarget = spa ? 200 : 300;

  if (cl !== null && cl < clLow) {
    output.push({ id: 'liq-chlorine', name: spa ? 'Chlorine / Bromine' : 'Liquid Chlorine', recommendedAmount: spa ? 150 : 400, unit: 'ml', reason: 'Raise free chlorine' });
  }
  if (cl !== null && cl > clHigh) {
    output.push({ id: 'cl-high', name: 'Partial drain & refill', recommendedAmount: calcDrainLitres(volumeLitres, cl, (clLow + clHigh) / 2), unit: 'L', reason: 'Free chlorine too high — dilute by draining & refilling' });
  }
  if (ph !== null && ph < 7.2) {
    output.push({ id: 'ph-up', name: 'pH Buffer', recommendedAmount: spa ? 50 : 150, unit: 'g', reason: 'Raise pH into target range' });
  }
  if (ph !== null && ph > phHigh) {
    output.push({ id: 'ph-down', name: 'Muriatic Acid', recommendedAmount: spa ? 80 : 250, unit: 'ml', reason: 'Lower pH into target range' });
  }
  if (alk !== null && alk < 80) {
    output.push({ id: 'alk-up', name: 'Alkalinity Up', recommendedAmount: spa ? 100 : 300, unit: 'g', reason: 'Raise alkalinity' });
  }
  if (alk !== null && alk > 120) {
    output.push({ id: 'alk-down', name: 'Muriatic Acid', recommendedAmount: spa ? 150 : 500, unit: 'ml', reason: 'Lower alkalinity — add acid in small doses with pump running' });
  }
  if (calcium !== null && calcium < caLow) {
    output.push({ id: 'calcium-low', name: 'Calcium Hardness Increaser', recommendedAmount: spa ? 200 : 500, unit: 'g', reason: `Raise calcium hardness into ${caLow}–${caHigh} range` });
  }
  if (calcium !== null && calcium > caHigh) {
    const drain = calcDrainLitres(volumeLitres, calcium, caTarget);
    output.push({ id: 'calcium-high', name: 'Partial drain & refill', recommendedAmount: drain, unit: 'L', reason: `Calcium too high — drain & refill to dilute to ~${caTarget} ppm` });
  }
  if (!spa && cya !== null && cya < 30) {
    output.push({ id: 'cya-low', name: 'Cyanuric Acid (Stabiliser)', recommendedAmount: 200, unit: 'g', reason: 'Raise stabiliser into 30–50 range' });
  }
  if (!spa && cya !== null && cya > 50) {
    const drain = calcDrainLitres(volumeLitres, cya, 40);
    output.push({ id: 'cya-high', name: 'Partial drain & refill', recommendedAmount: drain, unit: 'L', reason: 'CYA too high — drain & refill to dilute to ~40 ppm' });
  }

  if (output.length === 0) {
    output.push({ id: 'maintain', name: 'No correction needed', recommendedAmount: 0, unit: 'g', reason: 'All readings within target range' });
  }

  return output;
}
