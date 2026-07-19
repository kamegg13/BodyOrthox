import {
  isValidDob,
  parseDobToIso,
  formatDobMask,
  parseNumberOrNull,
  formatIsoDateForDisplay,
  labelForSex,
} from "../new-patient-validation";

describe("isValidDob", () => {
  it("accepte une date JJ/MM/AAAA valide et passée", () => {
    expect(isValidDob("01/01/1990")).toBe(true);
  });

  it("rejette un format qui ne correspond pas à JJ/MM/AAAA", () => {
    expect(isValidDob("1990-01-01")).toBe(false);
    expect(isValidDob("01/1990")).toBe(false);
    expect(isValidDob("")).toBe(false);
  });

  it("rejette un mois ou un jour hors bornes", () => {
    expect(isValidDob("01/13/1990")).toBe(false);
    expect(isValidDob("32/01/1990")).toBe(false);
    expect(isValidDob("00/01/1990")).toBe(false);
  });

  it("rejette une date calendaire inexistante (31 février)", () => {
    expect(isValidDob("31/02/1990")).toBe(false);
  });

  it("rejette une année antérieure à 1900", () => {
    expect(isValidDob("01/01/1899")).toBe(false);
  });

  it("rejette une date dans le futur", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const dd = String(future.getDate()).padStart(2, "0");
    const mm = String(future.getMonth() + 1).padStart(2, "0");
    const yyyy = String(future.getFullYear());
    expect(isValidDob(`${dd}/${mm}/${yyyy}`)).toBe(false);
  });

  it("tolère les espaces en début/fin de saisie", () => {
    expect(isValidDob("  01/01/1990  ")).toBe(true);
  });
});

describe("parseDobToIso", () => {
  it("convertit une date JJ/MM/AAAA valide en ISO AAAA-MM-JJ", () => {
    expect(parseDobToIso("15/06/1990")).toBe("1990-06-15");
  });

  it("renvoie null pour une date invalide", () => {
    expect(parseDobToIso("31/02/1990")).toBeNull();
    expect(parseDobToIso("pas une date")).toBeNull();
  });
});

describe("formatDobMask", () => {
  it("n'insère aucun séparateur avant le 3e chiffre", () => {
    expect(formatDobMask("0")).toBe("0");
    expect(formatDobMask("01")).toBe("01");
  });

  it("insère le premier séparateur après le jour", () => {
    expect(formatDobMask("011")).toBe("01/1");
    expect(formatDobMask("0106")).toBe("01/06");
  });

  it("insère les deux séparateurs une fois le mois complet", () => {
    expect(formatDobMask("01061")).toBe("01/06/1");
    expect(formatDobMask("01061990")).toBe("01/06/1990");
  });

  it("ignore les caractères non numériques et tronque au-delà de 8 chiffres", () => {
    expect(formatDobMask("01-06-1990ABC1234")).toBe("01/06/1990");
  });
});

describe("parseNumberOrNull", () => {
  it("renvoie null pour une saisie vide ou uniquement des espaces", () => {
    expect(parseNumberOrNull("")).toBeNull();
    expect(parseNumberOrNull("   ")).toBeNull();
  });

  it("renvoie null pour une valeur non numérique, nulle ou négative", () => {
    expect(parseNumberOrNull("abc")).toBeNull();
    expect(parseNumberOrNull("0")).toBeNull();
    expect(parseNumberOrNull("-5")).toBeNull();
  });

  it("renvoie le nombre pour une saisie numérique positive", () => {
    expect(parseNumberOrNull("165")).toBe(165);
    expect(parseNumberOrNull("58.5")).toBe(58.5);
  });
});

describe("formatIsoDateForDisplay", () => {
  it("renvoie une chaîne vide pour une entrée absente ou invalide", () => {
    expect(formatIsoDateForDisplay(undefined)).toBe("");
    expect(formatIsoDateForDisplay(null)).toBe("");
    expect(formatIsoDateForDisplay("pas une date")).toBe("");
  });

  it("convertit une date ISO en JJ/MM/AAAA", () => {
    expect(formatIsoDateForDisplay("1990-06-15T00:00:00.000Z")).toBe("15/06/1990");
  });
});

describe("labelForSex", () => {
  it("traduit chaque valeur de sexe en libellé affichable", () => {
    expect(labelForSex("female")).toBe("Femme");
    expect(labelForSex("male")).toBe("Homme");
    expect(labelForSex("other")).toBe("Non precise");
  });
});
