import { buildRecommendedTreatments } from '../chemistry';

function readings(overrides: Partial<Record<string, string>> = {}) {
  return {
    freeChlorine: '2',    // in range 1-3
    ph: '7.4',            // in range 7.2-7.6
    alkalinity: '100',    // in range 80-120
    calciumHardness: '300', // in range 200-400
    cyanuricAcid: '40',   // in range 30-50
    ...overrides,
  };
}

describe('buildRecommendedTreatments — all in range', () => {
  test('returns "No correction needed" when all readings are within target', () => {
    const result = buildRecommendedTreatments(readings());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('maintain');
  });
});

describe('buildRecommendedTreatments — chlorine', () => {
  test('low free chlorine (<1) → Liquid Chlorine', () => {
    const result = buildRecommendedTreatments(readings({ freeChlorine: '0.5' }));
    expect(result.some((r) => r.id === 'liq-chlorine')).toBe(true);
  });

  test('chlorine at exact lower bound (1) → no chlorine recommendation', () => {
    const result = buildRecommendedTreatments(readings({ freeChlorine: '1' }));
    expect(result.every((r) => r.id !== 'liq-chlorine')).toBe(true);
  });
});

describe('buildRecommendedTreatments — pH', () => {
  test('low pH (<7.2) → pH Buffer', () => {
    const result = buildRecommendedTreatments(readings({ ph: '7.0' }));
    expect(result.some((r) => r.id === 'ph-up')).toBe(true);
  });

  test('high pH (>7.6) → Muriatic Acid', () => {
    const result = buildRecommendedTreatments(readings({ ph: '7.8' }));
    expect(result.some((r) => r.id === 'ph-down')).toBe(true);
  });

  test('pH at exact bounds → no pH recommendation', () => {
    expect(buildRecommendedTreatments(readings({ ph: '7.2' })).every((r) => r.id !== 'ph-up')).toBe(true);
    expect(buildRecommendedTreatments(readings({ ph: '7.6' })).every((r) => r.id !== 'ph-down')).toBe(true);
  });
});

describe('buildRecommendedTreatments — alkalinity', () => {
  test('low alkalinity (<80) → Alkalinity Up', () => {
    const result = buildRecommendedTreatments(readings({ alkalinity: '60' }));
    expect(result.some((r) => r.id === 'alk-up')).toBe(true);
  });

  test('high alkalinity (>120) → Muriatic Acid', () => {
    const result = buildRecommendedTreatments(readings({ alkalinity: '150' }));
    expect(result.some((r) => r.id === 'alk-down')).toBe(true);
  });
});

describe('buildRecommendedTreatments — calcium hardness', () => {
  test('low calcium (<200) → Calcium Hardness Increaser', () => {
    const result = buildRecommendedTreatments(readings({ calciumHardness: '20' }));
    const rec = result.find((r) => r.id === 'calcium-low');
    expect(rec).toBeDefined();
    expect(rec?.unit).toBe('g');
    expect(rec?.recommendedAmount).toBeGreaterThan(0);
  });

  test('high calcium (>400) → Partial drain & refill with amount 0', () => {
    const result = buildRecommendedTreatments(readings({ calciumHardness: '600' }));
    const rec = result.find((r) => r.id === 'calcium-high');
    expect(rec).toBeDefined();
    expect(rec?.recommendedAmount).toBe(0);
  });

  test('calcium at exact bounds → no calcium recommendation', () => {
    expect(buildRecommendedTreatments(readings({ calciumHardness: '200' })).every((r) => r.id !== 'calcium-low')).toBe(true);
    expect(buildRecommendedTreatments(readings({ calciumHardness: '400' })).every((r) => r.id !== 'calcium-high')).toBe(true);
  });
});

describe('buildRecommendedTreatments — cyanuric acid (stabiliser)', () => {
  test('low CYA (<30) → Cyanuric Acid (Stabiliser)', () => {
    const result = buildRecommendedTreatments(readings({ cyanuricAcid: '9' }));
    const rec = result.find((r) => r.id === 'cya-low');
    expect(rec).toBeDefined();
    expect(rec?.recommendedAmount).toBeGreaterThan(0);
  });

  test('high CYA (>50) → Partial drain & refill with amount 0', () => {
    const result = buildRecommendedTreatments(readings({ cyanuricAcid: '80' }));
    const rec = result.find((r) => r.id === 'cya-high');
    expect(rec).toBeDefined();
    expect(rec?.recommendedAmount).toBe(0);
  });
});

describe('buildRecommendedTreatments — multiple issues', () => {
  test('screenshot readings (Ca=20, CYA=9) → two recommendations, no "maintain"', () => {
    const result = buildRecommendedTreatments(readings({ calciumHardness: '20', cyanuricAcid: '9' }));
    expect(result.some((r) => r.id === 'calcium-low')).toBe(true);
    expect(result.some((r) => r.id === 'cya-low')).toBe(true);
    expect(result.every((r) => r.id !== 'maintain')).toBe(true);
  });

  test('multiple problems → multiple recommendations', () => {
    const result = buildRecommendedTreatments(readings({
      freeChlorine: '0',
      ph: '7.0',
      alkalinity: '50',
      calciumHardness: '100',
      cyanuricAcid: '10',
    }));
    expect(result.length).toBeGreaterThanOrEqual(5);
    expect(result.every((r) => r.id !== 'maintain')).toBe(true);
  });
});

describe('buildRecommendedTreatments — edge cases', () => {
  test('non-numeric input → no crash, treats as no recommendation for that field', () => {
    expect(() => buildRecommendedTreatments(readings({ ph: 'abc' }))).not.toThrow();
  });

  test('empty string values → treated as null, no recommendations generated for those fields', () => {
    const result = buildRecommendedTreatments({ freeChlorine: '', ph: '', alkalinity: '', calciumHardness: '', cyanuricAcid: '' });
    expect(result[0].id).toBe('maintain');
  });
});
