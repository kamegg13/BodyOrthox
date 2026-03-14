import { Colors, ColorKey } from '../colors';

describe('Colors', () => {
  it('exports all required brand colors', () => {
    expect(Colors.primary).toBeDefined();
    expect(Colors.primaryDark).toBeDefined();
    expect(Colors.primaryLight).toBeDefined();
  });

  it('exports semantic colors', () => {
    expect(Colors.success).toBeDefined();
    expect(Colors.warning).toBeDefined();
    expect(Colors.error).toBeDefined();
    expect(Colors.info).toBeDefined();
  });

  it('exports background colors', () => {
    expect(Colors.background).toBeDefined();
    expect(Colors.backgroundCard).toBeDefined();
    expect(Colors.backgroundElevated).toBeDefined();
    expect(Colors.surface).toBeDefined();
  });

  it('exports text colors', () => {
    expect(Colors.textPrimary).toBeDefined();
    expect(Colors.textSecondary).toBeDefined();
    expect(Colors.textDisabled).toBeDefined();
  });

  it('exports confidence score colors', () => {
    expect(Colors.confidenceHigh).toBeDefined();
    expect(Colors.confidenceMedium).toBeDefined();
    expect(Colors.confidenceLow).toBeDefined();
  });

  it('exports chart colors', () => {
    expect(Colors.chartKnee).toBeDefined();
    expect(Colors.chartHip).toBeDefined();
    expect(Colors.chartAnkle).toBeDefined();
  });

  it('all color values are valid CSS color strings', () => {
    const values = Object.values(Colors);
    for (const color of values) {
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it('primary color is a hex color', () => {
    expect(Colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
