import React from "react";
import { Alert } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { CreatePatientRoute, formValuesToCreateInput } from "../create-patient-route";
import { NEW_PATIENT_DRAFT_KEY, type NewPatientFormValues } from "../../../screens/NewPatient";
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
