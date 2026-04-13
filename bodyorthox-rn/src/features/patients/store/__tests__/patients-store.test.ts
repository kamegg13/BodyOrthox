import { usePatientsStore } from '../patients-store';
import { IPatientRepository } from '../../data/patient-repository';
import { Patient } from '../../domain/patient';

const mockPatient: Patient = {
  id: 'p1',
  name: 'Jean Dupont',
  dateOfBirth: '1990-01-01',
  morphologicalProfile: { sex: 'male', activityLevel: 'active' },
  createdAt: '2024-01-01T00:00:00Z',
};

const mockPatient2: Patient = {
  id: 'p2',
  name: 'Alice Martin',
  dateOfBirth: '1985-03-20',
  morphologicalProfile: {
    sex: 'female',
    pains: [{ id: 'x', location: 'knee', side: 'left', intensity: 5, type: 'chronic' }],
  },
  createdAt: '2024-02-01T00:00:00Z',
};

function createMockRepo(overrides?: Partial<IPatientRepository>): IPatientRepository {
  return {
    getAll: jest.fn().mockResolvedValue([mockPatient]),
    getById: jest.fn().mockResolvedValue(mockPatient),
    create: jest.fn().mockResolvedValue(mockPatient),
    update: jest.fn().mockResolvedValue(mockPatient),
    archive: jest.fn().mockResolvedValue({ ...mockPatient, archivedAt: '2024-06-01T00:00:00Z' }),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('usePatientsStore', () => {
  beforeEach(() => {
    usePatientsStore.getState().setRepository(null as unknown as IPatientRepository);
    usePatientsStore.setState({
      patients: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      sortBy: 'alpha',
      activeFilters: new Set(),
      filteredPatients: [],
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

  describe('archivePatient', () => {
    it('sets archivedAt on patient in list', async () => {
      const repo = createMockRepo();
      usePatientsStore.setState({ patients: [mockPatient, mockPatient2] });
      usePatientsStore.getState().setRepository(repo);

      await usePatientsStore.getState().archivePatient('p1');

      const p = usePatientsStore.getState().patients.find(p => p.id === 'p1');
      expect(p?.archivedAt).toBe('2024-06-01T00:00:00Z');
      const { filteredPatients } = usePatientsStore.getState();
      expect(filteredPatients.find(p => p.id === 'p1')).toBeUndefined();
    });
  });

  describe('filteredPatients', () => {
    beforeEach(() => {
      usePatientsStore.setState({
        patients: [mockPatient, mockPatient2],
        searchQuery: '',
        sortBy: 'alpha',
        activeFilters: new Set(),
        // compute filtered: both patients are active (no archivedAt), sorted alpha → Alice, Jean
        filteredPatients: [mockPatient2, mockPatient],
      });
    });

    it('excludes archived patients by default', () => {
      const archived = { ...mockPatient, id: 'p3', archivedAt: '2024-01-01T00:00:00Z' };
      usePatientsStore.setState({
        patients: [mockPatient, mockPatient2, archived],
        activeFilters: new Set(),
        filteredPatients: [],
      });
      usePatientsStore.getState().setSortBy('alpha'); // triggers computeFiltered
      const { filteredPatients } = usePatientsStore.getState();
      expect(filteredPatients.find(p => p.id === 'p3')).toBeUndefined();
      expect(filteredPatients.length).toBe(2);
    });

    it('shows archived when filter "archived" is active', () => {
      const archived = { ...mockPatient, id: 'p3', archivedAt: '2024-01-01T00:00:00Z' };
      usePatientsStore.setState({
        patients: [mockPatient, archived],
        activeFilters: new Set(),
        filteredPatients: [],
      });
      usePatientsStore.getState().toggleFilter('archived');
      const { filteredPatients } = usePatientsStore.getState();
      expect(filteredPatients.find(p => p.id === 'p3')).toBeDefined();
    });

    it('filters by sex "male"', () => {
      usePatientsStore.getState().toggleFilter('male');
      const { filteredPatients } = usePatientsStore.getState();
      expect(filteredPatients.every(p => p.morphologicalProfile?.sex === 'male')).toBe(true);
    });

    it('filters patients with pains', () => {
      usePatientsStore.getState().toggleFilter('has-pains');
      const { filteredPatients } = usePatientsStore.getState();
      expect(filteredPatients.every(p => (p.morphologicalProfile?.pains?.length ?? 0) > 0)).toBe(true);
    });

    it('sorts alphabetically', () => {
      usePatientsStore.getState().setSortBy('alpha');
      const { filteredPatients } = usePatientsStore.getState();
      expect(filteredPatients[0].name).toBe('Alice Martin');
    });

    it('sorts by most recent (createdAt desc)', () => {
      usePatientsStore.getState().setSortBy('recent');
      const { filteredPatients } = usePatientsStore.getState();
      expect(filteredPatients[0].id).toBe('p2');
    });
  });
});
