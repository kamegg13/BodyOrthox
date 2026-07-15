/**
 * Tests for database initialization wiring.
 *
 * The API repositories are independent of the on-device database, so a failure
 * of the database `initialize()` must NOT leave the stores without a repository
 * (silent empty screens). The error must still propagate to the caller.
 *
 * Sous Jest, `./database` se résout vers database.native.ts (résolution
 * plateforme du preset react-native) — c'est donc lui qu'on mocke.
 */

const mockInitialize = jest.fn();

jest.mock('../database.native', () => ({
  createDatabase: () => ({
    initialize: mockInitialize,
    execute: jest.fn(),
    close: jest.fn(),
  }),
}));

import { initializeDatabase } from '../init';
import { usePatientsStore } from '../../../features/patients/store/patients-store';
import { useCaptureStore } from '../../../features/capture/store/capture-store';
import { useFeedbackStore } from '../../../features/feedback/store/feedback-store';

describe('initializeDatabase', () => {
  beforeEach(() => {
    mockInitialize.mockReset();
    jest.clearAllMocks();
  });

  it('wires the API repositories even when the database initialize() rejects', async () => {
    mockInitialize.mockRejectedValueOnce(new Error('db boom'));
    const patientsSpy = jest.spyOn(usePatientsStore.getState(), 'setRepository');
    const captureSpy = jest.spyOn(useCaptureStore.getState(), 'setRepository');
    const feedbackSpy = jest.spyOn(useFeedbackStore.getState(), 'setRepository');

    await expect(initializeDatabase()).rejects.toThrow('db boom');

    expect(patientsSpy).toHaveBeenCalledTimes(1);
    expect(captureSpy).toHaveBeenCalledTimes(1);
    expect(feedbackSpy).toHaveBeenCalledTimes(1);
  });
});
