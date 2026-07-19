/**
 * Tests for database initialization wiring — mode ON-DEVICE PUR.
 *
 * Décision produit (2026-07-15) : les données de santé (patients, analyses)
 * sont stockées uniquement sur l'appareil (SQLite chiffrable). Le feedback
 * reste sur l'API (pas une donnée de santé, doit parvenir à l'équipe).
 *
 * Sous Jest, `./database` se résout vers database.native.ts (résolution
 * plateforme du preset react-native) — c'est donc lui qu'on mocke.
 */

const mockInitialize = jest.fn();

jest.mock('../database.native', () => ({
  createDatabase: () => ({
    initialize: mockInitialize,
    execute: jest.fn(),
    transaction: jest.fn(),
    close: jest.fn(),
  }),
}));

import { initializeDatabase, __resetDatabaseForTests } from '../init';
import { usePatientsStore } from '../../../features/patients/store/patients-store';
import { useCaptureStore } from '../../../features/capture/store/capture-store';
import { useFeedbackStore } from '../../../features/feedback/store/feedback-store';
import { SqlitePatientRepository } from '../../../features/patients/data/sqlite-patient-repository';
import { SqliteAnalysisRepository } from '../../../features/capture/data/sqlite-analysis-repository';
import { ApiFeedbackRepository } from '../../../features/feedback/data/api-feedback-repository';

describe('initializeDatabase (on-device pur)', () => {
  beforeEach(() => {
    __resetDatabaseForTests();
    mockInitialize.mockReset().mockResolvedValue(undefined);
    jest.clearAllMocks();
  });

  it('câble patients et analyses sur les repositories SQLite on-device', async () => {
    const patientsSpy = jest.spyOn(usePatientsStore.getState(), 'setRepository');
    const captureSpy = jest.spyOn(useCaptureStore.getState(), 'setRepository');

    await initializeDatabase();

    expect(patientsSpy).toHaveBeenCalledWith(
      expect.any(SqlitePatientRepository),
    );
    expect(captureSpy).toHaveBeenCalledWith(
      expect.any(SqliteAnalysisRepository),
    );
  });

  it('garde le feedback sur le repository API (pas une donnée de santé)', async () => {
    const feedbackSpy = jest.spyOn(useFeedbackStore.getState(), 'setRepository');

    await initializeDatabase();

    expect(feedbackSpy).toHaveBeenCalledWith(
      expect.any(ApiFeedbackRepository),
    );
  });

  it("propage l'échec d'init : feedback câblé, mais pas les repos santé sans base", async () => {
    mockInitialize.mockRejectedValueOnce(new Error('db boom'));
    const patientsSpy = jest.spyOn(usePatientsStore.getState(), 'setRepository');
    const captureSpy = jest.spyOn(useCaptureStore.getState(), 'setRepository');
    const feedbackSpy = jest.spyOn(useFeedbackStore.getState(), 'setRepository');

    await expect(initializeDatabase()).rejects.toThrow('db boom');

    expect(feedbackSpy).toHaveBeenCalledTimes(1);
    expect(patientsSpy).not.toHaveBeenCalled();
    expect(captureSpy).not.toHaveBeenCalled();
  });

  it("un appel ultérieur retente après un échec (pas de cache d'échec)", async () => {
    mockInitialize.mockRejectedValueOnce(new Error('db boom'));
    await expect(initializeDatabase()).rejects.toThrow('db boom');

    const patientsSpy = jest.spyOn(usePatientsStore.getState(), 'setRepository');
    await initializeDatabase();

    expect(patientsSpy).toHaveBeenCalledWith(
      expect.any(SqlitePatientRepository),
    );
  });
});
