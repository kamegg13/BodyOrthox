import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { CreatePatientRoute, formValuesToCreateInput } from "../create-patient-route";
import { NEW_PATIENT_DRAFT_KEY, type NewPatientFormValues } from "../../../screens/new-patient/new-patient";
import {
  getKeyValueStorage,
  setKeyValueStorage,
  __resetKeyValueStorage,
  type KeyValueStorage,
} from "../../../core/storage/key-value-storage";

type BeforeRemoveEvent = { preventDefault: () => void; data: { action: unknown } };
type BeforeRemoveListener = (e: BeforeRemoveEvent) => void;

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
let capturedListener: BeforeRemoveListener | undefined;
const mockAddListener = jest.fn((event: string, listener: BeforeRemoveListener) => {
  if (event === "beforeRemove") capturedListener = listener;
  return jest.fn();
});

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
    dispatch: mockDispatch,
    addListener: mockAddListener,
  }),
}));

const mockCreatePatient = jest.fn();
jest.mock("../../../features/patients/store/patients-store", () => ({
  usePatientsStore: (selector: (s: { createPatient: jest.Mock }) => unknown) =>
    selector({ createPatient: mockCreatePatient }),
}));

function makeMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

describe("CreatePatientRoute — confirmation avant abandon", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedListener = undefined;
    setKeyValueStorage(makeMemoryStorage());
  });

  afterEach(() => {
    __resetKeyValueStorage();
  });

  it("laisse partir sans confirmation quand le formulaire n'a pas été modifié", () => {
    render(<CreatePatientRoute />);
    const preventDefault = jest.fn();
    capturedListener?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("bloque la sortie et demande confirmation quand la saisie est modifiée", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByTestId } = render(<CreatePatientRoute />);
    fireEvent.changeText(getByTestId("np-first-name"), "Sophie");

    const preventDefault = jest.fn();
    const action = { type: "GO_BACK" };
    capturedListener?.({ preventDefault, data: { action } });

    expect(preventDefault).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("abandonne, purge le brouillon et laisse la navigation continuer une fois confirmé", () => {
    getKeyValueStorage().setItem(NEW_PATIENT_DRAFT_KEY, JSON.stringify({ firstName: "Sophie" }));
    jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      const confirmButton = buttons?.find((b) => b.text === "Abandonner");
      confirmButton?.onPress?.();
    });
    const { getByTestId } = render(<CreatePatientRoute />);
    fireEvent.changeText(getByTestId("np-first-name"), "Sophie");

    const action = { type: "GO_BACK" };
    capturedListener?.({ preventDefault: jest.fn(), data: { action } });

    expect(mockDispatch).toHaveBeenCalledWith(action);
    expect(getKeyValueStorage().getItem(NEW_PATIENT_DRAFT_KEY)).toBeNull();
  });

  it("ne navigue pas si l'utilisateur choisit de continuer la saisie", () => {
    jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      const cancelButton = buttons?.find((b) => b.style === "cancel");
      cancelButton?.onPress?.();
    });
    const { getByTestId } = render(<CreatePatientRoute />);
    fireEvent.changeText(getByTestId("np-first-name"), "Sophie");

    capturedListener?.({ preventDefault: jest.fn(), data: { action: { type: "GO_BACK" } } });

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

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
    laterality: null,
    activityLevel: null,
    sport: "",
    pains: [],
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

  it("maps the clinical profile fields (laterality, activityLevel, sport, pains)", () => {
    const input = formValuesToCreateInput(
      makeValues({
        laterality: "left",
        activityLevel: "athlete",
        sport: "Tennis",
        pains: [
          { id: "p1", location: "knee", side: "left", intensity: 4, type: "chronic" },
        ],
      }),
    );
    expect(input.morphologicalProfile?.laterality).toBe("left");
    expect(input.morphologicalProfile?.activityLevel).toBe("athlete");
    expect(input.morphologicalProfile?.sport).toBe("Tennis");
    expect(input.morphologicalProfile?.pains).toHaveLength(1);
  });

  it("omits the clinical profile fields when left empty", () => {
    const input = formValuesToCreateInput(makeValues());
    expect(input.morphologicalProfile?.laterality).toBeUndefined();
    expect(input.morphologicalProfile?.activityLevel).toBeUndefined();
    expect(input.morphologicalProfile?.sport).toBeUndefined();
    expect(input.morphologicalProfile?.pains).toBeUndefined();
  });
});

function fillRequiredFields(getByTestId: ReturnType<typeof render>["getByTestId"], getByText: ReturnType<typeof render>["getByText"]) {
  fireEvent.changeText(getByTestId("np-first-name"), "Sophie");
  fireEvent.changeText(getByTestId("np-last-name"), "Leclerc");
  fireEvent.press(getByTestId("np-sex"));
  fireEvent.press(getByText("Femme"));
  fireEvent.changeText(getByTestId("np-dob"), "01011990");
}

describe("CreatePatientRoute — enregistrer sans capturer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setKeyValueStorage(makeMemoryStorage());
  });

  afterEach(() => {
    __resetKeyValueStorage();
  });

  it("navigue vers Capture avec le CTA principal", async () => {
    mockCreatePatient.mockResolvedValue({ id: "patient-1" });
    const { getByTestId, getByText } = render(<CreatePatientRoute />);
    fillRequiredFields(getByTestId, getByText);
    fireEvent.press(getByTestId("np-consent-0"));
    fireEvent.press(getByTestId("np-consent-1"));
    fireEvent.press(getByTestId("np-consent-2"));

    fireEvent.press(getByTestId("np-submit"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("Capture", {
        patientId: "patient-1",
        originTab: "AnalysesTab",
      });
    });
  });

  it("navigue vers la fiche patient avec le CTA « Enregistrer sans capturer »", async () => {
    mockCreatePatient.mockResolvedValue({ id: "patient-2" });
    const { getByTestId, getByText } = render(<CreatePatientRoute />);
    fillRequiredFields(getByTestId, getByText);
    fireEvent.press(getByTestId("np-consent-0"));
    fireEvent.press(getByTestId("np-consent-1"));
    fireEvent.press(getByTestId("np-consent-2"));

    fireEvent.press(getByTestId("np-submit-secondary"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("PatientDetail", { patientId: "patient-2" });
    });
    expect(mockNavigate).not.toHaveBeenCalledWith("Capture", expect.anything());
  });

  it("ne bloque plus la sortie après une création réussie (patient déjà enregistré)", async () => {
    // Bug vu en E2E : l'écran de création reste dans la pile sous la fiche
    // patient ; le reset post-analyse le démonte et déclenchait « Abandonner
    // la saisie ? » alors que le patient était bien enregistré.
    mockCreatePatient.mockResolvedValue({ id: "patient-4" });
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByTestId, getByText } = render(<CreatePatientRoute />);
    fillRequiredFields(getByTestId, getByText);
    fireEvent.press(getByTestId("np-consent-0"));
    fireEvent.press(getByTestId("np-consent-1"));
    fireEvent.press(getByTestId("np-consent-2"));

    fireEvent.press(getByTestId("np-submit-secondary"));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("PatientDetail", { patientId: "patient-4" });
    });

    const preventDefault = jest.fn();
    capturedListener?.({ preventDefault, data: { action: { type: "GO_BACK" } } });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
