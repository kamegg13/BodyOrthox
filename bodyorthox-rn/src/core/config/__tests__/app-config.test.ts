import { DevConfig, ProdConfig, AppConfiguration } from '../app-config';

describe('DevConfig', () => {
  it('has isProduction false', () => {
    expect(DevConfig.isProduction).toBe(false);
  });

  it('has ML logging enabled', () => {
    expect(DevConfig.enableMlLogging).toBe(true);
  });

  it('does not use encrypted database', () => {
    expect(DevConfig.useEncryptedDatabase).toBe(false);
  });

  it('has a database name', () => {
    expect(DevConfig.databaseName).toBeDefined();
    expect(DevConfig.databaseName.length).toBeGreaterThan(0);
  });
});

describe('ProdConfig', () => {
  it('has isProduction true', () => {
    expect(ProdConfig.isProduction).toBe(true);
  });

  it('has ML logging disabled', () => {
    expect(ProdConfig.enableMlLogging).toBe(false);
  });

  it('uses encrypted database', () => {
    expect(ProdConfig.useEncryptedDatabase).toBe(true);
  });

  it('has a production API key placeholder', () => {
    expect(ProdConfig.revenueCatApiKey).toBeDefined();
  });
});

describe('AppConfiguration', () => {
  it('is either DevConfig or ProdConfig', () => {
    const isDevOrProd = AppConfiguration === DevConfig || AppConfiguration === ProdConfig;
    expect(isDevOrProd).toBe(true);
  });

  it('exports isProduction as boolean', () => {
    expect(typeof AppConfiguration.isProduction).toBe('boolean');
  });
});
