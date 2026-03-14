import { Spacing, BorderRadius, IconSize } from '../spacing';

describe('Spacing', () => {
  it('follows the 8px grid system', () => {
    expect(Spacing.sm).toBe(8);
    expect(Spacing.md).toBe(16);
    expect(Spacing.lg).toBe(24);
    expect(Spacing.xl).toBe(32);
  });

  it('has all required spacing levels', () => {
    expect(Spacing.xxs).toBeDefined();
    expect(Spacing.xs).toBeDefined();
    expect(Spacing.sm).toBeDefined();
    expect(Spacing.md).toBeDefined();
    expect(Spacing.lg).toBeDefined();
    expect(Spacing.xl).toBeDefined();
    expect(Spacing.xxl).toBeDefined();
    expect(Spacing.xxxl).toBeDefined();
  });

  it('is in ascending order', () => {
    expect(Spacing.xxs).toBeLessThan(Spacing.xs);
    expect(Spacing.xs).toBeLessThan(Spacing.sm);
    expect(Spacing.sm).toBeLessThan(Spacing.md);
    expect(Spacing.md).toBeLessThan(Spacing.lg);
    expect(Spacing.lg).toBeLessThan(Spacing.xl);
    expect(Spacing.xl).toBeLessThan(Spacing.xxl);
    expect(Spacing.xxl).toBeLessThan(Spacing.xxxl);
  });
});

describe('BorderRadius', () => {
  it('exports all radius sizes', () => {
    expect(BorderRadius.sm).toBeDefined();
    expect(BorderRadius.md).toBeDefined();
    expect(BorderRadius.lg).toBeDefined();
    expect(BorderRadius.xl).toBeDefined();
    expect(BorderRadius.full).toBeDefined();
  });

  it('full radius is very large', () => {
    expect(BorderRadius.full).toBeGreaterThan(100);
  });
});

describe('IconSize', () => {
  it('exports all icon sizes', () => {
    expect(IconSize.sm).toBeDefined();
    expect(IconSize.md).toBeDefined();
    expect(IconSize.lg).toBeDefined();
    expect(IconSize.xl).toBeDefined();
  });
});
