import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PatientPickerModal } from "../PatientPickerModal";
import type { Patient } from "../../features/patients/domain/patient";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: overrides.id ?? "p1",
    name: "Jean Dupont",
    morphologicalProfile: null,
    createdAt: isoDaysAgo(10),
    ...overrides,
  };
}

describe("PatientPickerModal", () => {
  it("ne rend rien quand visible=false", () => {
    const { queryByLabelText } = render(
      <PatientPickerModal
        visible={false}
        patients={[makePatient()]}
        onSelectPatient={jest.fn()}
        onCreatePatient={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(queryByLabelText("Rechercher un patient")).toBeNull();
  });

  it("affiche le champ de recherche avec focus automatique et les patients récents en premier", () => {
    const patients = [
      makePatient({ id: "old", name: "Ancien Patient", createdAt: isoDaysAgo(30) }),
      makePatient({ id: "new", name: "Nouveau Patient", createdAt: isoDaysAgo(1) }),
    ];
    const { getByLabelText, getAllByRole } = render(
      <PatientPickerModal
        visible
        patients={patients}
        onSelectPatient={jest.fn()}
        onCreatePatient={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    const search = getByLabelText("Rechercher un patient");
    expect(search.props.autoFocus).toBe(true);

    const rows = getAllByRole("button").filter((el) =>
      ["Ancien Patient", "Nouveau Patient"].includes(el.props.accessibilityLabel),
    );
    expect(rows[0]?.props.accessibilityLabel).toBe("Nouveau Patient");
    expect(rows[1]?.props.accessibilityLabel).toBe("Ancien Patient");
  });

  it("filtre les patients par nom", () => {
    const patients = [
      makePatient({ id: "p1", name: "Jean Dupont" }),
      makePatient({ id: "p2", name: "Marie Curie" }),
    ];
    const { getByLabelText, queryByLabelText } = render(
      <PatientPickerModal
        visible
        patients={patients}
        onSelectPatient={jest.fn()}
        onCreatePatient={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    fireEvent.changeText(getByLabelText("Rechercher un patient"), "marie");
    expect(queryByLabelText("Jean Dupont")).toBeNull();
    expect(getByLabelText("Marie Curie")).toBeTruthy();
  });

  it("filtre les patients par ID court", () => {
    const patients = [
      makePatient({ id: "abcdefgh1234", name: "Jean Dupont" }),
      makePatient({ id: "zzzzzzzzzzzz", name: "Marie Curie" }),
    ];
    const { getByLabelText, queryByLabelText } = render(
      <PatientPickerModal
        visible
        patients={patients}
        onSelectPatient={jest.fn()}
        onCreatePatient={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    // shortId("abcdefgh1234") => "P-ABCD"
    fireEvent.changeText(getByLabelText("Rechercher un patient"), "P-ABCD");
    expect(getByLabelText("Jean Dupont")).toBeTruthy();
    expect(queryByLabelText("Marie Curie")).toBeNull();
  });

  it("exclut les patients archivés de la liste et de la recherche", () => {
    const patients = [
      makePatient({ id: "active", name: "Actif Patient" }),
      makePatient({ id: "archived", name: "Archivé Patient", archivedAt: isoDaysAgo(1) }),
    ];
    const { queryByLabelText } = render(
      <PatientPickerModal
        visible
        patients={patients}
        onSelectPatient={jest.fn()}
        onCreatePatient={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(queryByLabelText("Archivé Patient")).toBeNull();
  });

  it("déclenche onSelectPatient avec le bon patient au tap sur une ligne", () => {
    const patient = makePatient({ id: "p1", name: "Jean Dupont" });
    const onSelectPatient = jest.fn();
    const { getByLabelText } = render(
      <PatientPickerModal
        visible
        patients={[patient]}
        onSelectPatient={onSelectPatient}
        onCreatePatient={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    fireEvent.press(getByLabelText("Jean Dupont"));
    expect(onSelectPatient).toHaveBeenCalledWith(patient);
  });

  it("déclenche onCreatePatient au tap sur « Nouveau patient »", () => {
    const onCreatePatient = jest.fn();
    const { getByLabelText } = render(
      <PatientPickerModal
        visible
        patients={[makePatient()]}
        onSelectPatient={jest.fn()}
        onCreatePatient={onCreatePatient}
        onClose={jest.fn()}
      />,
    );
    fireEvent.press(getByLabelText("Nouveau patient"));
    expect(onCreatePatient).toHaveBeenCalledTimes(1);
  });

  it("affiche un état vide actionnable et « Nouveau patient » reste accessible quand la liste est vide", () => {
    const { getByText, getByLabelText } = render(
      <PatientPickerModal
        visible
        patients={[]}
        onSelectPatient={jest.fn()}
        onCreatePatient={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(getByText("Aucun patient")).toBeTruthy();
    expect(getByLabelText("Nouveau patient")).toBeTruthy();
  });

  it("déclenche onClose au tap sur le bouton fermer", () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <PatientPickerModal
        visible
        patients={[makePatient()]}
        onSelectPatient={jest.fn()}
        onCreatePatient={jest.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.press(getByLabelText("Fermer"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("déclenche onClose au tap sur le fond (backdrop)", () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <PatientPickerModal
        visible
        patients={[makePatient()]}
        onSelectPatient={jest.fn()}
        onCreatePatient={jest.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.press(getByLabelText("Fermer le sélecteur de patient"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("déclenche onClose via le bouton retour Android (onRequestClose)", () => {
    const onClose = jest.fn();
    const { UNSAFE_getByType } = render(
      <PatientPickerModal
        visible
        patients={[makePatient()]}
        onSelectPatient={jest.fn()}
        onCreatePatient={jest.fn()}
        onClose={onClose}
      />,
    );
    const { Modal } = require("react-native");
    const modal = UNSAFE_getByType(Modal);
    modal.props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
