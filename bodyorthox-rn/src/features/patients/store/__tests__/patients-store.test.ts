import { usePatientsStore } from '../patients-store';
import { IPatientRepository } from '../../data/patient-repository';
import { Patient } from '../../domain/patient';

const mockPatient: Patient = {
  id: 'p1',
  name: 'Jean Dupont',
  dateOfBirth: '1990-01-01',
  morphologicalProfile: null,
  createdAt: '2024-01-01T00:00:00Z',
};

function createMockRepo(overrides?: Partial<IPatientRepository>): IPatientRepository {
  return {
    getAll: jest.fn().mockResolvedValue([mockPatient]),
    getById: jest.fn().mockResolvedValue(mockPatient),
    create: jest.fn().mockResolvedValue(mockPatient),
    update: jest.fn().mockResolvedValue(mockPatient),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('usePatientsStore', () => {
  beforeEach(() => {
    usePatientsStore.setState({
      patients: [],
      isLoading: false,
      error: null,
      searchQuery: '',
    });
  });

  describe('loadPatients', () => {
    it('loads patients from repository', async () => {
      const repo = createMockRepo();
      usePatientsStore.getState().setRepository(repo);

      await usePatientsStore.getState().loadPatients();

      expect(usePatientsStore.getState().patients).toHaveLength(1);
      expect(usePatientsStore.getState().patients[0].name).toBe('Jean Dupont');
      expect(usePatientsStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      const repo = createMockRepo({
        getAll: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      usePatientsStore.getState().setRepository(repo);

      await usePatientsStore.getState().loadPatients();

      expect(usePatientsStore.getState().error).toBe('DB error');
      expect(usePatientsStore.getState().isLoading).toBe(false);
    });

    it('does nothing when no repository set', async () => {
      // Reset repository by calling setRepository with null-like
      usePatientsStore.getState().setRepository(null as unknown as IPatientRepository);
      // No error thrown
      await usePatientsStore.getState().loadPatients();
      expect(usePatientsStore.getState().patients).toHaveLength(0);
    });
  });

  describe('createPatient', () => {
    it('adds patient to list on success', async () => {
      const repo = createMockRepo();
      usePatientsStore.getState().setRepository(repo);

      await usePatientsStore.getState().createPatient({
        name: 'Jean Dupont',
        dateOfBirth: '1990-01-01',
      });

      expect(usePatientsStore.getState().patients).toHaveLength(1);
    });

    it('sets error on failure', async () => {
      const repo = createMockRepo({
        create: jest.fn().mockRejectedValue(new Error('Create failed')),
      });
      usePatientsStore.getState().setRepository(repo);

      await expect(
        usePatientsStore.getState().createPatient({ name: 'Test', dateOfBirth: '1990-01-01' })
      ).rejects.toThrow('Create failed');

      expect(usePatientsStore.getState().error).toBe('Create failed');
    });
  });

  describe('deletePatient', () => {
    it('removes patient from list', async () => {
      const repo = createMockRepo();
      usePatientsStore.setState({ patients: [mockPatient] });
      usePatientsStore.getState().setRepository(repo);

      await usePatientsStore.getState().deletePatient('p1');

      expect(usePatientsStore.getState().patients).toHaveLength(0);
    });
  });

  describe('updatePatient', () => {
    it('updates patient in list', async () => {
      const updatedPatient = { ...mockPatient, name: 'Jane Dupont' };
      const repo = createMockRepo({
        update: jest.fn().mockResolvedValue(updatedPatient),
      });
      usePatientsStore.setState({ patients: [mockPatient] });
      usePatientsStore.getState().setRepository(repo);

      await usePatientsStore.getState().updatePatient('p1', { name: 'Jane Dupont' });

      expect(usePatientsStore.getState().patients[0].name).toBe('Jane Dupont');
    });
  });

  describe('setSearchQuery', () => {
    it('updates search query and reloads', async () => {
      const repo = createMockRepo();
      usePatientsStore.getState().setRepository(repo);

      usePatientsStore.getState().setSearchQuery('Jean');

      // Wait for async loadPatients
      await new Promise(r => setTimeout(r, 10));
      expect(usePatientsStore.getState().searchQuery).toBe('Jean');
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      usePatientsStore.setState({ error: 'Some error' });
      usePatientsStore.getState().clearError();
      expect(usePatientsStore.getState().error).toBeNull();
    });
  });
});
