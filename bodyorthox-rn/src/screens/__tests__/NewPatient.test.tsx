import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { TextInput } from "react-native";
import { NewPatient, NEW_PATIENT_DRAFT_KEY } from "../NewPatient";
import {
  setKeyValueStorage,
  __resetKeyValueStorage,
  type KeyValueStorage,
} from "../../core/storage/key-value-storage";

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

function fillRequiredFields(getByTestId: ReturnType<typeof render>["getByTestId"], getByText: ReturnType<typeof render>["getByText"]) {
  fireEvent.changeText(getByTestId("np-first-name"), "Sophie");
  fireEvent.changeText(getByTestId("np-last-name"), "Leclerc");
  fireEvent.press(getByTestId("np-sex"));
  fireEvent.press(getByText("Femme"));
  fireEvent.changeText(getByTestId("np-dob"), "01011990");
}

describe("NewPatient — consentements RGPD & médecin référent", () => {
  it("n'autorise pas la soumission tant que les 3 consentements ne sont pas cochés", () => {
    const onSave = jest.fn();
    const { getByTestId, getByText } = render(<NewPatient onSave={onSave} />);
    fillRequiredFields(getByTestId, getByText);

    fireEvent.press(getByTestId("np-submit"));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("transmet les 3 consentements granulaires et une date de consentement à onSave", () => {
    const onSave = jest.fn();
    const { getByTestId, getByText } = render(<NewPatient onSave={onSave} />);
    fillRequiredFields(getByTestId, getByText);

    fireEvent.press(getByTestId("np-consent-0"));
    fireEvent.press(getByTestId("np-consent-1"));
    fireEvent.press(getByTestId("np-consent-2"));
    fireEvent.press(getByTestId("np-submit"));

    expect(onSave).toHaveBeenCalledTimes(1);
    const values = onSave.mock.calls[0][0];
    expect(values.consentStorage).toBe(true);
    expect(values.consentPhotoCapture).toBe(true);
    expect(values.consentPdfExport).toBe(true);
    expect(values.consentDate).toEqual(expect.any(String));
    expect(() => new Date(values.consentDate)).not.toThrow();
  });

  it("transmet le médecin référent saisi, trimé", () => {
    const onSave = jest.fn();
    const { getByTestId, getByText } = render(<NewPatient onSave={onSave} />);
    fillRequiredFields(getByTestId, getByText);
    fireEvent.changeText(getByTestId("np-referring-physician"), "  Dr. Martin  ");
    fireEvent.press(getByTestId("np-consent-0"));
    fireEvent.press(getByTestId("np-consent-1"));
    fireEvent.press(getByTestId("np-consent-2"));

    fireEvent.press(getByTestId("np-submit"));
    const values = onSave.mock.calls[0][0];
    expect(values.referringPhysician).toBe("Dr. Martin");
  });

  it("ne transmet pas de consentement quand skipConsents est actif", () => {
    const onSave = jest.fn();
    const { getByTestId, getByText } = render(<NewPatient onSave={onSave} skipConsents />);
    fillRequiredFields(getByTestId, getByText);

    fireEvent.press(getByTestId("np-submit"));

    expect(onSave).toHaveBeenCalledTimes(1);
    const values = onSave.mock.calls[0][0];
    expect(values.consentStorage).toBe(false);
    expect(values.consentPhotoCapture).toBe(false);
    expect(values.consentPdfExport).toBe(false);
    expect(values.consentDate).toBeNull();
  });
});

describe("NewPatient — validation par champ au blur", () => {
  it("n'affiche pas d'erreur avant toute interaction", () => {
    const { queryByText } = render(<NewPatient onSave={jest.fn()} />);
    expect(queryByText("Le prenom est requis.")).toBeNull();
  });

  it("affiche l'erreur sous le champ Prenom uniquement après son blur", () => {
    const { getByTestId, queryByText, getByText } = render(<NewPatient onSave={jest.fn()} />);
    expect(queryByText("Le prenom est requis.")).toBeNull();

    fireEvent(getByTestId("np-first-name"), "blur");

    expect(getByText("Le prenom est requis.")).toBeTruthy();
    // Les autres champs non touchés ne sont pas encore signalés.
    expect(queryByText("Le nom est requis.")).toBeNull();
  });

  it("efface l'erreur dès que le champ redevient valide", () => {
    const { getByTestId, queryByText, getByText } = render(<NewPatient onSave={jest.fn()} />);
    fireEvent(getByTestId("np-first-name"), "blur");
    expect(getByText("Le prenom est requis.")).toBeTruthy();

    fireEvent.changeText(getByTestId("np-first-name"), "Sophie");
    expect(queryByText("Le prenom est requis.")).toBeNull();
  });

  it("signale la date de naissance manquante puis un format invalide distinctement", () => {
    const { getByTestId, getByText, queryByText } = render(<NewPatient onSave={jest.fn()} />);
    fireEvent(getByTestId("np-dob"), "blur");
    expect(getByText("La date de naissance est requise.")).toBeTruthy();

    fireEvent.changeText(getByTestId("np-dob"), "31021990"); // 31 février n'existe pas
    fireEvent(getByTestId("np-dob"), "blur");
    expect(queryByText("La date de naissance est requise.")).toBeNull();
    expect(getByText(/Date invalide/)).toBeTruthy();
  });

  it("efface l'erreur du sexe une fois une valeur choisie dans le picker", () => {
    const { getByTestId, getByText, queryByTestId } = render(<NewPatient onSave={jest.fn()} />);
    fireEvent.press(getByTestId("np-submit")); // force submitAttempted=true, révèle l'erreur
    expect(queryByTestId("np-sex-error")).toBeTruthy();

    fireEvent.press(getByTestId("np-sex"));
    fireEvent.press(getByText("Femme"));

    expect(queryByTestId("np-sex-error")).toBeNull();
  });

  it("au submit, marque tous les champs requis vides comme invalides", () => {
    const { getByTestId, getByText } = render(<NewPatient onSave={jest.fn()} />);
    fireEvent.press(getByTestId("np-submit"));

    expect(getByText("Le prenom est requis.")).toBeTruthy();
    expect(getByText("Le nom est requis.")).toBeTruthy();
    expect(getByText("Le sexe est requis.")).toBeTruthy();
    expect(getByText("La date de naissance est requise.")).toBeTruthy();
  });

  it("au submit avec erreurs, place le focus sur le premier champ invalide", () => {
    const focusSpy = jest.spyOn(TextInput.prototype, "focus");
    const { getByTestId } = render(<NewPatient onSave={jest.fn()} />);

    fireEvent.press(getByTestId("np-submit"));

    expect(focusSpy).toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it("focus le champ Nom quand seul le Prenom est déjà valide", () => {
    const focusOrder: string[] = [];
    const firstNameSpy = jest
      .spyOn(TextInput.prototype, "focus")
      .mockImplementation(function (this: TextInput) {
        focusOrder.push("called");
      });
    const { getByTestId } = render(<NewPatient onSave={jest.fn()} />);
    fireEvent.changeText(getByTestId("np-first-name"), "Sophie");

    fireEvent.press(getByTestId("np-submit"));

    expect(focusOrder.length).toBe(1);
    firstNameSpy.mockRestore();
  });

  it("affiche un message clair près des consentements si la soumission est tentée sans eux", () => {
    const onSave = jest.fn();
    const { getByTestId, getByText } = render(<NewPatient onSave={onSave} />);
    fillRequiredFields(getByTestId, getByText);

    fireEvent.press(getByTestId("np-submit"));

    expect(getByText("Les 3 consentements sont requis pour creer le patient.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe("NewPatient — dirty tracking", () => {
  it("signale onDirtyChange(false) tant que rien n'a été saisi", () => {
    const onDirtyChange = jest.fn();
    render(<NewPatient onSave={jest.fn()} onDirtyChange={onDirtyChange} />);
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("signale onDirtyChange(true) dès qu'un champ est modifié", () => {
    const onDirtyChange = jest.fn();
    const { getByTestId } = render(<NewPatient onSave={jest.fn()} onDirtyChange={onDirtyChange} />);
    fireEvent.changeText(getByTestId("np-first-name"), "Sophie");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });

  it("redevient propre si la saisie est annulée manuellement", () => {
    const onDirtyChange = jest.fn();
    const { getByTestId } = render(<NewPatient onSave={jest.fn()} onDirtyChange={onDirtyChange} />);
    fireEvent.changeText(getByTestId("np-first-name"), "Sophie");
    fireEvent.changeText(getByTestId("np-first-name"), "");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });
});

describe("NewPatient — brouillon (autosave)", () => {
  beforeEach(() => {
    setKeyValueStorage(makeMemoryStorage());
  });

  afterEach(() => {
    __resetKeyValueStorage();
  });

  it("persiste la saisie après un court délai puis la restaure au remontage", async () => {
    const { getByTestId, unmount } = render(<NewPatient onSave={jest.fn()} />);
    fireEvent.changeText(getByTestId("np-first-name"), "Sophie");
    fireEvent.changeText(getByTestId("np-last-name"), "Leclerc");

    await waitFor(
      () => {
        expect(
          JSON.parse(
            require("../../core/storage/key-value-storage")
              .getKeyValueStorage()
              .getItem(NEW_PATIENT_DRAFT_KEY) ?? "null",
          )?.firstName,
        ).toBe("Sophie");
      },
      { timeout: 2000 },
    );

    unmount();

    const { getByTestId: getByTestId2, getByText: getByText2 } = render(
      <NewPatient onSave={jest.fn()} />,
    );
    expect(getByTestId2("np-first-name").props.value).toBe("Sophie");
    expect(getByTestId2("np-last-name").props.value).toBe("Leclerc");
    expect(getByText2("Brouillon restaure")).toBeTruthy();
  });

  it("ne restaure jamais les consentements dans le brouillon", async () => {
    const { getByTestId, unmount } = render(<NewPatient onSave={jest.fn()} />);
    fireEvent.changeText(getByTestId("np-first-name"), "Sophie");
    fireEvent.press(getByTestId("np-consent-0"));

    await waitFor(
      () => {
        const draft = JSON.parse(
          require("../../core/storage/key-value-storage")
            .getKeyValueStorage()
            .getItem(NEW_PATIENT_DRAFT_KEY) ?? "null",
        );
        expect(draft?.firstName).toBe("Sophie");
        expect(draft?.consentStorage).toBeUndefined();
      },
      { timeout: 2000 },
    );

    unmount();
    const { getByTestId: getByTestId2 } = render(<NewPatient onSave={jest.fn()} />);
    expect(getByTestId2("np-consent-0").props.accessibilityState.checked).toBe(false);
  });

  it("efface le brouillon quand la creation aboutit", async () => {
    const onSave = jest.fn();
    const { getByTestId, getByText } = render(<NewPatient onSave={onSave} />);
    fillRequiredFields(getByTestId, getByText);
    fireEvent.press(getByTestId("np-consent-0"));
    fireEvent.press(getByTestId("np-consent-1"));
    fireEvent.press(getByTestId("np-consent-2"));

    await waitFor(
      () => {
        expect(
          require("../../core/storage/key-value-storage").getKeyValueStorage().getItem(NEW_PATIENT_DRAFT_KEY),
        ).not.toBeNull();
      },
      { timeout: 2000 },
    );

    fireEvent.press(getByTestId("np-submit"));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(
      require("../../core/storage/key-value-storage").getKeyValueStorage().getItem(NEW_PATIENT_DRAFT_KEY),
    ).toBeNull();
  });

  it("le bandeau « Effacer » vide le formulaire et purge le brouillon", async () => {
    const { getByTestId, getByText, unmount } = render(<NewPatient onSave={jest.fn()} />);
    fireEvent.changeText(getByTestId("np-first-name"), "Sophie");

    await waitFor(
      () => {
        expect(
          require("../../core/storage/key-value-storage").getKeyValueStorage().getItem(NEW_PATIENT_DRAFT_KEY),
        ).not.toBeNull();
      },
      { timeout: 2000 },
    );
    unmount();

    const { getByTestId: getByTestId2, getByText: getByText2 } = render(
      <NewPatient onSave={jest.fn()} />,
    );
    expect(getByTestId2("np-first-name").props.value).toBe("Sophie");
    fireEvent.press(getByTestId2("np-draft-clear"));

    expect(getByTestId2("np-first-name").props.value).toBe("");
    expect(
      require("../../core/storage/key-value-storage").getKeyValueStorage().getItem(NEW_PATIENT_DRAFT_KEY),
    ).toBeNull();
  });
});
