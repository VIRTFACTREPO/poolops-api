export type LsiInput = {
  ph: number;
  alkalinity: number;
  calciumHardness: number;
  cyanuricAcid: number;
  temperatureC?: number;
};

export type LsiResult = {
  score: number;
  label: 'corrosive' | 'balanced' | 'scaling';
  description: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// Lightweight saturation-index approximation for MVP UI feedback.
export function calculateLsi(input: LsiInput): LsiResult {
  const temp = input.temperatureC ?? 25;
  const phTerm = input.ph - 7.5;
  const alkTerm = Math.log10(clamp(input.alkalinity, 1, 500) / 100);
  const calTerm = Math.log10(clamp(input.calciumHardness, 1, 1000) / 250);
  const cyaPenalty = clamp(input.cyanuricAcid, 0, 150) / 300;
  const tempAdj = (temp - 25) * 0.01;

  const score = Number((phTerm + alkTerm + calTerm - cyaPenalty + tempAdj).toFixed(2));

  if (score < -0.3) {
    return { score, label: 'corrosive', description: 'Slightly corrosive water' };
  }
  if (score > 0.3) {
    return { score, label: 'scaling', description: 'Scale-forming tendency' };
  }
  return { score, label: 'balanced', description: 'Balanced water chemistry' };
}
