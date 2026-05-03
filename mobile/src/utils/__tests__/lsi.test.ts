import { calculateLsi } from '../lsi';

describe('calculateLsi', () => {
  // Baseline: ideal pool chemistry at 25°C should produce a near-zero LSI
  test('perfect readings → balanced', () => {
    const result = calculateLsi({ ph: 7.5, alkalinity: 100, calciumHardness: 250, cyanuricAcid: 0 });
    expect(result.score).toBeCloseTo(0, 1);
    expect(result.label).toBe('balanced');
  });

  // Verified against actual app screenshot: pH 7.3, Alk 90, Ca 20, CYA 9 → -1.37
  test('screenshot readings match displayed LSI of -1.37', () => {
    const result = calculateLsi({ ph: 7.3, alkalinity: 90, calciumHardness: 20, cyanuricAcid: 9 });
    expect(result.score).toBeCloseTo(-1.37, 1);
    expect(result.label).toBe('corrosive');
    expect(result.description).toBe('Slightly corrosive water');
  });

  test('low pH drives score corrosive', () => {
    const result = calculateLsi({ ph: 7.0, alkalinity: 100, calciumHardness: 250, cyanuricAcid: 30 });
    expect(result.score).toBeLessThan(-0.3);
    expect(result.label).toBe('corrosive');
  });

  test('high pH + high calcium drives score scaling', () => {
    const result = calculateLsi({ ph: 7.8, alkalinity: 120, calciumHardness: 400, cyanuricAcid: 0 });
    expect(result.score).toBeGreaterThan(0.3);
    expect(result.label).toBe('scaling');
    expect(result.description).toBe('Scale-forming tendency');
  });

  test('high CYA reduces LSI score (acts as acid buffer)', () => {
    const base = calculateLsi({ ph: 7.5, alkalinity: 100, calciumHardness: 250, cyanuricAcid: 0 });
    const withCya = calculateLsi({ ph: 7.5, alkalinity: 100, calciumHardness: 250, cyanuricAcid: 50 });
    expect(withCya.score).toBeLessThan(base.score);
  });

  test('higher CYA lowers LSI score (CYA acts as buffering penalty)', () => {
    const lowCya = calculateLsi({ ph: 7.5, alkalinity: 100, calciumHardness: 250, cyanuricAcid: 0 });
    const highCya = calculateLsi({ ph: 7.5, alkalinity: 100, calciumHardness: 250, cyanuricAcid: 50 });
    expect(highCya.score).toBeLessThan(lowCya.score);
  });

  test('balanced band is -0.3 to +0.3 exclusive', () => {
    // CYA=100 → cyaPenalty=0.333 → score=-0.333 → corrosive
    const justCorrosive = calculateLsi({ ph: 7.5, alkalinity: 100, calciumHardness: 250, cyanuricAcid: 100 });
    expect(justCorrosive.label).toBe('corrosive');

    const justScaling = calculateLsi({ ph: 7.8, alkalinity: 110, calciumHardness: 300, cyanuricAcid: 0 });
    expect(justScaling.label).toBe('scaling');
  });
});
