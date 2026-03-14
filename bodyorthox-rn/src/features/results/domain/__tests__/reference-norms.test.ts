import {
  REFERENCE_NORMS,
  assessAngle,
  deviationColor,
  DeviationLevel,
} from '../reference-norms';

describe('REFERENCE_NORMS', () => {
  it('defines norms for all three joints', () => {
    expect(REFERENCE_NORMS.knee).toBeDefined();
    expect(REFERENCE_NORMS.hip).toBeDefined();
    expect(REFERENCE_NORMS.ankle).toBeDefined();
  });

  it('each norm has required fields', () => {
    for (const norm of Object.values(REFERENCE_NORMS)) {
      expect(typeof norm.normalMin).toBe('number');
      expect(typeof norm.normalMax).toBe('number');
      expect(norm.normalMin).toBeLessThan(norm.normalMax);
      expect(norm.unit).toBe('°');
      expect(norm.label).toBeDefined();
    }
  });
});

describe('assessAngle', () => {
  describe('knee joint', () => {
    it('returns normal for angle within range', () => {
      const result = assessAngle('knee', 5);
      expect(result.level).toBe('normal');
      expect(result.isWithinNorm).toBe(true);
      expect(result.deviation).toBe(0);
    });

    it('returns mild for small deviation', () => {
      const norm = REFERENCE_NORMS.knee;
      const result = assessAngle('knee', norm.normalMax + 3);
      expect(result.level).toBe('mild');
      expect(result.isWithinNorm).toBe(false);
      expect(result.deviation).toBe(3);
    });

    it('returns moderate for medium deviation', () => {
      const norm = REFERENCE_NORMS.knee;
      const result = assessAngle('knee', norm.normalMax + 10);
      expect(result.level).toBe('moderate');
    });

    it('returns severe for large deviation', () => {
      const norm = REFERENCE_NORMS.knee;
      const result = assessAngle('knee', norm.normalMax + 20);
      expect(result.level).toBe('severe');
    });

    it('returns deviation on the low side', () => {
      const norm = REFERENCE_NORMS.knee;
      const result = assessAngle('knee', norm.normalMin - 3);
      expect(result.isWithinNorm).toBe(false);
      expect(result.deviation).toBeCloseTo(3, 1);
    });
  });

  describe('hip joint', () => {
    it('returns normal for angle in range', () => {
      const result = assessAngle('hip', 175);
      expect(result.isWithinNorm).toBe(true);
    });

    it('returns assessment with correct norm reference', () => {
      const result = assessAngle('hip', 175);
      expect(result.norm.joint).toBe('hip');
    });
  });

  describe('ankle joint', () => {
    it('returns normal for 90 degrees', () => {
      const result = assessAngle('ankle', 90);
      expect(result.isWithinNorm).toBe(true);
    });
  });

  it('includes the assessed value in result', () => {
    const result = assessAngle('knee', 5.5);
    expect(result.value).toBe(5.5);
  });
});

describe('deviationColor', () => {
  it('returns green for normal', () => {
    expect(deviationColor('normal')).toBe('#27ae60');
  });

  it('returns orange/yellow for mild', () => {
    expect(deviationColor('mild')).toBeDefined();
    expect(typeof deviationColor('mild')).toBe('string');
  });

  it('returns orange for moderate', () => {
    expect(deviationColor('moderate')).toBeDefined();
  });

  it('returns red for severe', () => {
    expect(deviationColor('severe')).toBe('#e74c3c');
  });

  it('each level returns a different color', () => {
    const levels: DeviationLevel[] = ['normal', 'mild', 'moderate', 'severe'];
    const colors = levels.map(deviationColor);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(4);
  });
});
