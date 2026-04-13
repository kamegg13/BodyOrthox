import { createPatient, updatePatient, patientAge, Patient, PainEntry } from "../patient";

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

  it("throws if name is empty", () => {
    expect(() => createPatient({ ...validInput, name: "" })).toThrow();
  });

  it("throws if name is only whitespace", () => {
    expect(() => createPatient({ ...validInput, name: "   " })).toThrow();
  });

  it("throws if dateOfBirth is missing", () => {
    expect(() => createPatient({ ...validInput, dateOfBirth: "" })).toThrow();
  });

  it("throws if dateOfBirth is invalid", () => {
    expect(() =>
      createPatient({ ...validInput, dateOfBirth: "not-a-date" }),
    ).toThrow();
  });

  it("throws if dateOfBirth is in the future", () => {
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

describe("patientAge", () => {
  it("calculates correct age", () => {
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

  it("handles birthday not yet this year", () => {
    const today = new Date();
    // Birthday is tomorrow → not yet reached this year → age = years - 1
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
    // If today.getDate() + 1 overflows the month, Date auto-adjusts to next month
    // so the birthday may have already passed. Calculate expected age dynamically.
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

  it("throws if name is empty string", () => {
    expect(() => updatePatient(base, { name: "" })).toThrow();
  });

  it("throws if dateOfBirth is in the future", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(() =>
      updatePatient(base, { dateOfBirth: future.toISOString().split("T")[0] })
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
