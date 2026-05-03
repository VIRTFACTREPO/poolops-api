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
  unit: 'ml' | 'g';
  reason: string;
};

function parseReading(value: string) {
  if (!value.trim()) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function buildRecommendedTreatments(readings: ChemicalReadings): TreatmentRecommendation[] {
  const output: TreatmentRecommendation[] = [];
  const cl = parseReading(readings.freeChlorine);
  const ph = parseReading(readings.ph);
  const alk = parseReading(readings.alkalinity);
  const calcium = parseReading(readings.calciumHardness);
  const cya = parseReading(readings.cyanuricAcid);

  if (cl !== null && cl < 1) {
    output.push({ id: 'liq-chlorine', name: 'Liquid Chlorine', recommendedAmount: 400, unit: 'ml', reason: 'Raise free chlorine' });
  }
  if (ph !== null && ph < 7.2) {
    output.push({ id: 'ph-up', name: 'pH Buffer', recommendedAmount: 150, unit: 'g', reason: 'Raise pH into target range' });
  }
  if (ph !== null && ph > 7.6) {
    output.push({ id: 'ph-down', name: 'Muriatic Acid', recommendedAmount: 250, unit: 'ml', reason: 'Lower pH into target range' });
  }
  if (alk !== null && alk < 80) {
    output.push({ id: 'alk-up', name: 'Alkalinity Up', recommendedAmount: 300, unit: 'g', reason: 'Raise alkalinity' });
  }
  if (alk !== null && alk > 120) {
    output.push({ id: 'alk-down', name: 'Muriatic Acid', recommendedAmount: 500, unit: 'ml', reason: 'Lower alkalinity — add acid in small doses with pump running' });
  }
  if (calcium !== null && calcium < 200) {
    output.push({ id: 'calcium-low', name: 'Calcium Hardness Increaser', recommendedAmount: 500, unit: 'g', reason: 'Raise calcium hardness into 200–400 range' });
  }
  if (calcium !== null && calcium > 400) {
    output.push({ id: 'calcium-high', name: 'Partial drain & refill', recommendedAmount: 0, unit: 'g', reason: 'Calcium hardness too high — no chemical fix, dilution required' });
  }
  if (cya !== null && cya < 30) {
    output.push({ id: 'cya-low', name: 'Cyanuric Acid (Stabiliser)', recommendedAmount: 200, unit: 'g', reason: 'Raise stabiliser into 30–50 range' });
  }
  if (cya !== null && cya > 50) {
    output.push({ id: 'cya-high', name: 'Partial drain & refill', recommendedAmount: 0, unit: 'g', reason: 'Cyanuric acid too high — no chemical fix, dilution required' });
  }

  if (output.length === 0) {
    output.push({ id: 'maintain', name: 'No correction needed', recommendedAmount: 0, unit: 'g', reason: 'All readings within target range' });
  }

  return output;
}
