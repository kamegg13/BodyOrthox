import {
  isDraftEmpty,
  readDraft,
  persistDraft,
  clearNewPatientDraft,
  NEW_PATIENT_DRAFT_KEY,
  type NewPatientDraftV1,
} from "../new-patient-draft";
import {
  getKeyValueStorage,
  setKeyValueStorage,
  __resetKeyValueStorage,
  type KeyValueStorage,
} from "../../../core/storage/key-value-storage";

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

const EMPTY_DRAFT: NewPatientDraftV1 = {
  firstName: "",
  lastName: "",
  sex: null,
  dob: "",
  heightCm: "",
  weightKg: "",
  diagnosis: "",
  referring: "",
  observations: "",
  laterality: null,
  activityLevel: null,
  sport: "",
  pains: [],
};

describe("isDraftEmpty", () => {
  it("considère un brouillon sans aucun champ renseigné comme vide", () => {
    expect(isDraftEmpty(EMPTY_DRAFT)).toBe(true);
  });

  it("considère un brouillon avec un seul champ texte renseigné comme non vide", () => {
    expect(isDraftEmpty({ ...EMPTY_DRAFT, firstName: "Sophie" })).toBe(false);
  });

  it("considère un brouillon avec une douleur ajoutée comme non vide", () => {
    expect(
      isDraftEmpty({
        ...EMPTY_DRAFT,
        pains: [{ id: "p1", location: "knee", side: "left", intensity: 3, type: "chronic" }],
      }),
    ).toBe(false);
  });
});

describe("readDraft / persistDraft", () => {
  beforeEach(() => {
    setKeyValueStorage(makeMemoryStorage());
  });

  afterEach(() => {
    __resetKeyValueStorage();
  });

  it("renvoie null quand aucun brouillon n'est stocké", () => {
    expect(readDraft()).toBeNull();
  });

  it("persiste un brouillon non vide puis le relit à l'identique", () => {
    const draft: NewPatientDraftV1 = { ...EMPTY_DRAFT, firstName: "Sophie", lastName: "Leclerc" };
    persistDraft(draft);
    expect(readDraft()).toEqual(draft);
  });

  it("purge la clé de stockage quand le brouillon persisté est vide", () => {
    persistDraft({ ...EMPTY_DRAFT, firstName: "Sophie" });
    persistDraft(EMPTY_DRAFT);
    expect(readDraft()).toBeNull();
  });

  it("renvoie null pour un JSON corrompu au lieu de lever une exception", () => {
    setKeyValueStorage({
      getItem: () => "{ceci n'est pas du json",
      setItem: () => undefined,
      removeItem: () => undefined,
    });
    expect(readDraft()).toBeNull();
  });

  it("comble les champs manquants d'un brouillon partiel par leurs valeurs par défaut", () => {
    setKeyValueStorage({
      getItem: () => JSON.stringify({ firstName: "Sophie" }),
      setItem: () => undefined,
      removeItem: () => undefined,
    });
    expect(readDraft()).toEqual({ ...EMPTY_DRAFT, firstName: "Sophie" });
  });
});

describe("clearNewPatientDraft", () => {
  beforeEach(() => {
    setKeyValueStorage(makeMemoryStorage());
  });

  afterEach(() => {
    __resetKeyValueStorage();
  });

  it("supprime le brouillon stocké sous NEW_PATIENT_DRAFT_KEY", () => {
    getKeyValueStorage().setItem(NEW_PATIENT_DRAFT_KEY, JSON.stringify(EMPTY_DRAFT));
    clearNewPatientDraft();
    expect(getKeyValueStorage().getItem(NEW_PATIENT_DRAFT_KEY)).toBeNull();
  });
});
