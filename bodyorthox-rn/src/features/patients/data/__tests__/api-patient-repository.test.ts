global.fetch = jest.fn();

jest.mock('../../../../core/auth/token-storage', () => ({
  loadTokens: jest.fn().mockResolvedValue({ jwt: 'test-jwt', refreshToken: 'ref' }),
  saveTokens: jest.fn(),
}));

import { ApiPatientRepository } from '../api-patient-repository';

const mockFetch = global.fetch as jest.Mock;

function mockOk(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: true, status, json: async () => data });
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('getAll returns patients from API', async () => {
  mockOk([{ id: '1', name: 'Jean', dateOfBirth: '1980-01-01', userId: 'u1', createdAt: '', updatedAt: '' }]);
  const repo = new ApiPatientRepository();
  const patients = await repo.getAll();
  expect(patients).toHaveLength(1);
  expect(patients[0].name).toBe('Jean');
});

test('create sends POST and maps response to Patient', async () => {
  mockOk({ id: '2', name: 'Marie', dateOfBirth: '1990-05-10', userId: 'u1', createdAt: '', updatedAt: '' }, 201);
  const repo = new ApiPatientRepository();
  const patient = await repo.create({ name: 'Marie', dateOfBirth: '1990-05-10' });
  expect(patient.name).toBe('Marie');
  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining('/patients'),
    expect.objectContaining({ method: 'POST' }),
  );
});

test('delete calls DELETE endpoint', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => undefined });
  const repo = new ApiPatientRepository();
  await repo.delete('patient-id');
  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining('/patients/patient-id'),
    expect.objectContaining({ method: 'DELETE' }),
  );
});
