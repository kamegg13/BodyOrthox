import { ApiPatientRepository } from '../api-patient-repository';
import { apiRequest } from '../../../../core/api/api-client';

jest.mock('../../../../core/api/api-client');
const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const apiPatient = {
  id: 'p1',
  userId: 'u1',
  name: 'Jean Dupont',
  dateOfBirth: '1990-01-01',
  heightCm: 175,
  weightKg: 70,
  bmi: 22.9,
  notes: 'notes',
  sex: 'male',
  laterality: 'right',
  activityLevel: 'active',
  sport: 'tennis',
  pathology: 'gonarthrose',
  pains: [{ id: 'pain1', location: 'knee', side: 'left', intensity: 7, type: 'chronic' }],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('ApiPatientRepository', () => {
  let repo: ApiPatientRepository;

  beforeEach(() => {
    repo = new ApiPatientRepository();
    jest.clearAllMocks();
  });

  it('getAll maps API response to Patient', async () => {
    mockApiRequest.mockResolvedValue([apiPatient]);
    const patients = await repo.getAll();
    expect(patients[0].morphologicalProfile?.sex).toBe('male');
    expect(patients[0].morphologicalProfile?.pains).toHaveLength(1);
  });

  it('update sends new fields and maps response', async () => {
    mockApiRequest.mockResolvedValue({ ...apiPatient, name: 'Marie' });
    const updated = await repo.update('p1', { name: 'Marie' });
    expect(updated.name).toBe('Marie');
    expect(mockApiRequest).toHaveBeenCalledWith('/patients/p1', expect.objectContaining({ method: 'PUT' }));
  });

  it('archive calls PATCH /patients/:id/archive', async () => {
    mockApiRequest.mockResolvedValue({ ...apiPatient, archivedAt: '2024-06-01T00:00:00Z' });
    const archived = await repo.archive('p1');
    expect(archived.archivedAt).toBe('2024-06-01T00:00:00Z');
    expect(mockApiRequest).toHaveBeenCalledWith('/patients/p1/archive', expect.objectContaining({ method: 'PATCH' }));
  });

  it('create sends all morpho fields including sex and pains', async () => {
    mockApiRequest.mockResolvedValue(apiPatient);
    await repo.create({
      name: 'Jean Dupont',
      dateOfBirth: '1990-01-01',
      morphologicalProfile: {
        sex: 'male',
        sport: 'tennis',
        pains: [{ id: 'pain1', location: 'knee', side: 'left', intensity: 7, type: 'chronic' }],
      },
    });
    expect(mockApiRequest).toHaveBeenCalledWith('/patients', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"sex":"male"'),
    }));
  });

  it('delete calls DELETE /patients/:id', async () => {
    mockApiRequest.mockResolvedValue(undefined);
    await repo.delete('p1');
    expect(mockApiRequest).toHaveBeenCalledWith('/patients/p1', expect.objectContaining({ method: 'DELETE' }));
  });
});
