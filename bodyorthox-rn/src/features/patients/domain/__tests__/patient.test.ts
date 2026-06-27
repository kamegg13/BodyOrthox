import {
  createPatient,
  updatePatient,
  patientAge,
  patientDisplayName,
  patientBirthYear,
  Patient,
  PainEntry,
} from "../patient";

jest.mock("../../../../shared/utils/generate-id", () => ({
  generateId: () => "mock-uuid-1234",
}));

describe("createPatient", () => {
  const validInput = {
    name: "Jean Dupont",
    dateOfBirth: "1990-05-15",
  };

  it("creates a patient with valid input", () => {
    const patient = createPatient(validInput);
    expect(patient.id).toBe("mock-uuid-1234");
    expect(patient.name).toBe("Jean Dupont");
    expect(patient.dateOfBirth).toBe("1990-05-15");
    expect(patient.morphologicalProfile).toBeNull();
    expect(patient.createdAt).toBeDefined();
  });

  it("trims whitespace from name", () => {
    const patient = createPatient({ ...validInput, name: "  Jean Dupont  " });
    expect(patient.name).toBe("Jean Dupont");
  });

  // --- Minimisation RGPD : identité optionnelle ---

  it("does NOT throw when name is missing (minimisation)", () => {
    expect(() => createPatient({ dateOfBirth: "1990-05-15" })).not.toThrow();
  });

  it("does NOT throw when dateOfBirth is missing (minimisation)", () => {
    expect(() => createPatient({ name: "Jean Dupont" })).not.toThrow();
  });

  it("does NOT throw when both name and dateOfBirth are missing", () => {
    expect(() => createPatient({})).not.toThrow();
  });

  it("generates a default displayLabel from id when no name/displayLabel given", () => {
    const patient = createPatient({});
    // id = "mock-uuid-1234" → slice(0,6) = "mock-u"
    expect(patient.displayLabel).toBe("Patient mock-u");
    expect(patient.name).toBeUndefined();
  });

  it("keeps a provided displayLabel without requiring a name", () => {
    const patient = createPatient({ displayLabel: "PAT-0427" });
    expect(patient.displayLabel).toBe("PAT-0427");
    expect(patient.name).toBeUndefined();
  });

  it("does not overwrite displayLabel when only a name is provided", () => {
    const patient = createPatient({ name: "Jean Dupont" });
    expect(patient.displayLabel).toBeUndefined();
    expect(patient.name).toBe("Jean Dupont");
  });

  it("stores birthYear when provided", () => {
    const patient = createPatient({ birthYear: 1990 });
    expect(patient.birthYear).toBe(1990);
    expect(patient.dateOfBirth).toBeUndefined();
  });

  it("stores consent fields when provided", () => {
    const patient = createPatient({
      name: "Jean",
      consentGiven: true,
      consentDate: "2026-01-01T00:00:00Z",
    });
    expect(patient.consentGiven).toBe(true);
    expect(patient.consentDate).toBe("2026-01-01T00:00:00Z");
  });

  // --- Validation conservée uniquement quand la donnée est présente ---

  it("throws if dateOfBirth is invalid (when provided)", () => {
    expect(() =>
      createPatient({ ...validInput, dateOfBirth: "not-a-date" }),
    ).toThrow();
  });

  it("throws if dateOfBirth is in the future (when provided)", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(() =>
      createPatient({
        ...validInput,
        dateOfBirth: future.toISOString().split("T")[0],
      }),
    ).toThrow();
  });

  it("stores morphological profile when provided", () => {
    const patient = createPatient({
      ...validInput,
      morphologicalProfile: { heightCm: 175, weightKg: 70 },
    });
    expect(patient.morphologicalProfile?.heightCm).toBe(175);
    expect(patient.morphologicalProfile?.weightKg).toBe(70);
  });

  it("createdAt is an ISO string", () => {
    const patient = createPatient(validInput);
    expect(() => new Date(patient.createdAt)).not.toThrow();
    expect(new Date(patient.createdAt)).toBeInstanceOf(Date);
  });
});

describe("patientDisplayName", () => {
  const base: Patient = {
    id: "abcdef123456",
    morphologicalProfile: null,
    createdAt: "2024-01-01T00:00:00Z",
  };

  it("prefers displayLabel", () => {
    expect(
      patientDisplayName({ ...base, displayLabel: "PAT-0427", name: "Jean" }),
    ).toBe("PAT-0427");
  });

  it("falls back to name when no displayLabel", () => {
    expect(patientDisplayName({ ...base, name: "Jean Dupont" })).toBe(
      "Jean Dupont",
    );
  });

  it("falls back to a label derived from id when nothing else", () => {
    expect(patientDisplayName(base)).toBe("Patient abcdef");
  });
});

describe("patientBirthYear", () => {
  const base: Patient = {
    id: "p1",
    morphologicalProfile: null,
    createdAt: "2024-01-01T00:00:00Z",
  };

  it("prefers explicit birthYear", () => {
    expect(patientBirthYear({ ...base, birthYear: 1990 })).toBe(1990);
  });

  it("derives year from dateOfBirth when no birthYear", () => {
    expect(patientBirthYear({ ...base, dateOfBirth: "1985-06-15" })).toBe(1985);
  });

  it("returns undefined when neither is present", () => {
    expect(patientBirthYear(base)).toBeUndefined();
  });
});

describe("patientAge", () => {
  it("calculates correct age from dateOfBirth", () => {
    const today = new Date();
    const dob = new Date(
      today.getFullYear() - 35,
      today.getMonth(),
      today.getDate(),
    );
    const patient: Patient = {
      id: "1",
      name: "Test",
      dateOfBirth: dob.toISOString().split("T")[0],
      morphologicalProfile: null,
      createdAt: new Date().toISOString(),
    };
    expect(patientAge(patient)).toBe(35);
  });

  it("approximates age from birthYear when no dateOfBirth", () => {
    const year = new Date().getFullYear();
    const patient: Patient = {
      id: "1",
      birthYear: year - 40,
      morphologicalProfile: null,
      createdAt: new Date().toISOString(),
    };
    expect(patientAge(patient)).toBe(40);
  });

  it("returns undefined when no birth information at all", () => {
    const patient: Patient = {
      id: "1",
      morphologicalProfile: null,
      createdAt: new Date().toISOString(),
    };
    expect(patientAge(patient)).toBeUndefined();
  });

  it("handles birthday not yet this year", () => {
    const today = new Date();
    const dob = new Date(
      today.getFullYear() - 40,
      today.getMonth(),
      today.getDate() + 1,
    );
    const patient: Patient = {
      id: "1",
      name: "Test",
      dateOfBirth: dob.toISOString().split("T")[0],
      morphologicalProfile: null,
      createdAt: new Date().toISOString(),
    };
    const dobDate = new Date(dob.toISOString().split("T")[0]);
    const ageYear = today.getFullYear() - dobDate.getFullYear();
    const birthdayThisYear = new Date(
      today.getFullYear(),
      dobDate.getMonth(),
      dobDate.getDate(),
    );
    const expectedAge = today < birthdayThisYear ? ageYear - 1 : ageYear;
    expect(patientAge(patient)).toBe(expectedAge);
  });
});

describe("updatePatient", () => {
  const base: Patient = {
    id: "p1",
    name: "Jean Dupont",
    dateOfBirth: "1990-01-01",
    morphologicalProfile: null,
    createdAt: "2024-01-01T00:00:00Z",
  };

  it("returns a new object (immutable)", () => {
    const updated = updatePatient(base, { name: "Marie Dupont" });
    expect(updated).not.toBe(base);
    expect(updated.name).toBe("Marie Dupont");
    expect(base.name).toBe("Jean Dupont");
  });

  it("updates name", () => {
    const updated = updatePatient(base, { name: "Marie Dupont" });
    expect(updated.name).toBe("Marie Dupont");
  });

  it("updates displayLabel", () => {
    const updated = updatePatient(base, { displayLabel: "PAT-0001" });
    expect(updated.displayLabel).toBe("PAT-0001");
  });

  it("updates birthYear", () => {
    const updated = updatePatient(base, { birthYear: 1988 });
    expect(updated.birthYear).toBe(1988);
  });

  it("updates consent fields", () => {
    const updated = updatePatient(base, {
      consentGiven: true,
      consentDate: "2026-01-01T00:00:00Z",
    });
    expect(updated.consentGiven).toBe(true);
    expect(updated.consentDate).toBe("2026-01-01T00:00:00Z");
  });

  it("updates dateOfBirth", () => {
    const updated = updatePatient(base, { dateOfBirth: "1985-06-15" });
    expect(updated.dateOfBirth).toBe("1985-06-15");
  });

  it("updates morphologicalProfile with new fields", () => {
    const pain: PainEntry = {
      id: "pain1",
      location: "knee",
      side: "left",
      intensity: 7,
      type: "chronic",
      notes: "douleur à l'effort",
    };
    const updated = updatePatient(base, {
      morphologicalProfile: {
        sex: "female",
        laterality: "right",
        activityLevel: "active",
        sport: "tennis",
        pathology: "gonarthrose",
        pains: [pain],
        heightCm: 165,
        weightKg: 60,
      },
    });
    expect(updated.morphologicalProfile?.sex).toBe("female");
    expect(updated.morphologicalProfile?.pains).toHaveLength(1);
    expect(updated.morphologicalProfile?.pains?.[0].location).toBe("knee");
  });

  it("throws if dateOfBirth is in the future", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(() =>
      updatePatient(base, { dateOfBirth: future.toISOString().split("T")[0] }),
    ).toThrow();
  });

  it("preserves id and createdAt", () => {
    const updated = updatePatient(base, { name: "Marie" });
    expect(updated.id).toBe("p1");
    expect(updated.createdAt).toBe("2024-01-01T00:00:00Z");
  });

  it("preserves archivedAt when present", () => {
    const archived = { ...base, archivedAt: "2025-01-01T00:00:00Z" };
    const updated = updatePatient(archived, { name: "Marie" });
    expect(updated.archivedAt).toBe("2025-01-01T00:00:00Z");
  });

  it("throws if dateOfBirth is invalid string", () => {
    expect(() => updatePatient(base, { dateOfBirth: "not-a-date" })).toThrow();
  });

  it("returns equivalent patient when no fields are provided", () => {
    const updated = updatePatient(base, {});
    expect(updated.id).toBe(base.id);
    expect(updated.name).toBe(base.name);
    expect(updated.dateOfBirth).toBe(base.dateOfBirth);
    expect(updated.morphologicalProfile).toBe(base.morphologicalProfile);
  });
});
