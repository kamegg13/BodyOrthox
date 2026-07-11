import { formValuesToCreateInput } from "../create-patient-route";
import type { NewPatientFormValues } from "../../../screens/NewPatient";

function makeValues(overrides: Partial<NewPatientFormValues> = {}): NewPatientFormValues {
  return {
    firstName: "Sophie",
    lastName: "Leclerc",
    sex: "female",
    dateOfBirth: "1990-01-01",
    heightCm: 165,
    weightKg: 58,
    diagnosis: "Scoliose",
    referringPhysician: "",
    observations: "",
    consentStorage: false,
    consentPhotoCapture: false,
    consentPdfExport: false,
    consentDate: null,
    ...overrides,
  };
}

describe("formValuesToCreateInput", () => {
  it("maps referringPhysician to the top-level CreatePatientInput field", () => {
    const input = formValuesToCreateInput(makeValues({ referringPhysician: "Dr. Martin" }));
    expect(input.referringPhysician).toBe("Dr. Martin");
  });

  it("omits referringPhysician when blank", () => {
    const input = formValuesToCreateInput(makeValues({ referringPhysician: "" }));
    expect(input.referringPhysician).toBeUndefined();
  });

  it("maps the 3 granular consents and consentDate", () => {
    const input = formValuesToCreateInput(
      makeValues({
        consentStorage: true,
        consentPhotoCapture: true,
        consentPdfExport: true,
        consentDate: "2026-01-01T00:00:00.000Z",
      }),
    );
    expect(input.consentStorage).toBe(true);
    expect(input.consentPhotoCapture).toBe(true);
    expect(input.consentPdfExport).toBe(true);
    expect(input.consentDate).toBe("2026-01-01T00:00:00.000Z");
  });

  it("derives the aggregate consentGiven as true only when all 3 consents are true", () => {
    expect(
      formValuesToCreateInput(
        makeValues({ consentStorage: true, consentPhotoCapture: true, consentPdfExport: false }),
      ).consentGiven,
    ).toBe(false);
    expect(
      formValuesToCreateInput(
        makeValues({ consentStorage: true, consentPhotoCapture: true, consentPdfExport: true }),
      ).consentGiven,
    ).toBe(true);
  });

  it("does not fabricate a consentDate when consents were not captured", () => {
    const input = formValuesToCreateInput(makeValues({ consentDate: null }));
    expect(input.consentDate).toBeUndefined();
  });
});
