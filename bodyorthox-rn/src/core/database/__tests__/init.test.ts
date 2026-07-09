/**
 * Tests for database initialization wiring.
 *
 * The API repositories are independent of the on-device shim, so a failure of
 * the shim's `initialize()` must NOT leave the stores without a repository
 * (silent empty screens). The error must still propagate to the caller.
 */

import { Platform } from 'react-native';

const mockInitialize = jest.fn();

jest.mock('../database.web', () => ({
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
    (Platform as any).OS = 'web';
    mockInitialize.mockReset();
    jest.clearAllMocks();
  });

  it('wires the API repositories even when the shim initialize() rejects', async () => {
    mockInitialize.mockRejectedValueOnce(new Error('shim boom'));
    const patientsSpy = jest.spyOn(usePatientsStore.getState(), 'setRepository');
    const captureSpy = jest.spyOn(useCaptureStore.getState(), 'setRepository');
    const feedbackSpy = jest.spyOn(useFeedbackStore.getState(), 'setRepository');

    await expect(initializeDatabase()).rejects.toThrow('shim boom');

    expect(patientsSpy).toHaveBeenCalledTimes(1);
    expect(captureSpy).toHaveBeenCalledTimes(1);
    expect(feedbackSpy).toHaveBeenCalledTimes(1);
  });
});
