/**
 * Application configuration (dev / prod flavour).
 */
export interface AppConfig {
  readonly isProduction: boolean;
  readonly revenueCatApiKey: string;
  readonly enableMlLogging: boolean;
  readonly useEncryptedDatabase: boolean;
  readonly databaseName: string;
}

export const DevConfig: AppConfig = {
  isProduction: false,
  revenueCatApiKey: 'sandbox_api_key_placeholder',
  enableMlLogging: true,
  useEncryptedDatabase: false,
  databaseName: 'bodyorthox_dev.db',
};

export const ProdConfig: AppConfig = {
  isProduction: true,
  revenueCatApiKey: 'prod_api_key_placeholder',
  enableMlLogging: false,
  useEncryptedDatabase: true,
  databaseName: 'bodyorthox.db',
};

const __DEV__ = process.env.NODE_ENV !== 'production';

export const AppConfiguration: AppConfig = __DEV__ ? DevConfig : ProdConfig;
