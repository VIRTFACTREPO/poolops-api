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
    expect(result.every((r) => r.id !== 'cl-high')).toBe(true);
  });

  test('chlorine at exact lower bound (1) → no chlorine recommendation', () => {
    const result = buildRecommendedTreatments(readings({ freeChlorine: '1' }));
    expect(result.every((r) => r.id !== 'liq-chlorine')).toBe(true);
    expect(result.every((r) => r.id !== 'cl-high')).toBe(true);
  });

  test('high free chlorine (>3) → Partial drain & refill', () => {
    const result = buildRecommendedTreatments(readings({ freeChlorine: '6' }), 50000);
    const rec = result.find((r) => r.id === 'cl-high');
    expect(rec).toBeDefined();
    expect(rec?.name).toBe('Partial drain & refill');
    expect(rec?.unit).toBe('L');
    expect(rec?.recommendedAmount).toBeGreaterThan(0);
  });

  test('chlorine in range does not include drain recommendation', () => {
    const result = buildRecommendedTreatments(readings({ freeChlorine: '2.5' }), 50000);
    expect(result.every((r) => r.id !== 'cl-high')).toBe(true);
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

describe('buildRecommendedTreatments — spa mode', () => {
  function spaReadings(overrides: Partial<Record<string, string>> = {}) {
    return {
      freeChlorine: '4',      // in spa range 3-5
      ph: '7.4',              // in range 7.2-7.8
      alkalinity: '100',      // in range 80-120
      calciumHardness: '200', // in spa range 150-250
      cyanuricAcid: '',       // not used for spa
      ...overrides,
    };
  }

  test('spa with all readings in range → "No correction needed"', () => {
    const result = buildRecommendedTreatments(spaReadings(), undefined, true);
    expect(result[0].id).toBe('maintain');
  });

  test('spa low calcium (<150) → Calcium Hardness Increaser 200g', () => {
    const result = buildRecommendedTreatments(spaReadings({ calciumHardness: '10' }), undefined, true);
    const rec = result.find((r) => r.id === 'calcium-low');
    expect(rec).toBeDefined();
    expect(rec?.recommendedAmount).toBe(200);
    expect(rec?.unit).toBe('g');
  });

  test('spa high calcium (>250) → Partial drain with volume calc', () => {
    const result = buildRecommendedTreatments(spaReadings({ calciumHardness: '400' }), 1000, true);
    const rec = result.find((r) => r.id === 'calcium-high');
    expect(rec).toBeDefined();
    expect(rec?.unit).toBe('L');
    expect(rec?.recommendedAmount).toBeGreaterThan(0);
  });

  test('spa low chlorine (<3) → Chlorine / Bromine', () => {
    const result = buildRecommendedTreatments(spaReadings({ freeChlorine: '1' }), undefined, true);
    const rec = result.find((r) => r.id === 'liq-chlorine');
    expect(rec?.name).toBe('Chlorine / Bromine');
    expect(rec?.recommendedAmount).toBe(150);
  });

  test('spa does not produce CYA recommendation', () => {
    const result = buildRecommendedTreatments(spaReadings({ cyanuricAcid: '0' }), undefined, true);
    expect(result.every((r) => r.id !== 'cya-low' && r.id !== 'cya-high')).toBe(true);
  });

  test('spa ph > 7.8 → Muriatic Acid (spa phHigh is 7.8, not 7.6)', () => {
    const atLimit = buildRecommendedTreatments(spaReadings({ ph: '7.8' }), undefined, true);
    expect(atLimit.every((r) => r.id !== 'ph-down')).toBe(true);
    const overLimit = buildRecommendedTreatments(spaReadings({ ph: '7.9' }), undefined, true);
    expect(overLimit.some((r) => r.id === 'ph-down')).toBe(true);
  });
});

describe('buildRecommendedTreatments — drain volume calculation', () => {
  test('high calcium with known volume → non-zero drain litres', () => {
    const result = buildRecommendedTreatments(readings({ calciumHardness: '600' }), 50000);
    const rec = result.find((r) => r.id === 'calcium-high');
    expect(rec?.recommendedAmount).toBeGreaterThan(0);
    expect(rec?.unit).toBe('L');
  });

  test('high CYA with known volume → non-zero drain litres', () => {
    const result = buildRecommendedTreatments(readings({ cyanuricAcid: '80' }), 50000);
    const rec = result.find((r) => r.id === 'cya-high');
    expect(rec?.recommendedAmount).toBeGreaterThan(0);
  });

  test('drain litres rounded to nearest 500', () => {
    // Ca=600, target=300, pool=50000L → drain = 50000*(1-300/600) = 25000
    const result = buildRecommendedTreatments(readings({ calciumHardness: '600' }), 50000);
    const rec = result.find((r) => r.id === 'calcium-high');
    expect(rec?.recommendedAmount! % 500).toBe(0);
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
