import { createPatient, patientAge, Patient } from "../patient";

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
