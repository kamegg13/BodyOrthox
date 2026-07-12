import React from "react";
import { Alert } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { PatientDetail, SAMPLE_PATIENT_DETAIL } from "../PatientDetail";

describe("PatientDetail — zone dangereuse", () => {
  it("renders the archive and delete actions, separated from normal actions", () => {
    const { getByTestId, getByText } = render(<PatientDetail data={SAMPLE_PATIENT_DETAIL} />);
    expect(getByText("Zone dangereuse")).toBeTruthy();
    expect(getByTestId("archive-button")).toBeTruthy();
    expect(getByTestId("delete-button")).toBeTruthy();
  });

  it("asks for confirmation before deleting, mentioning the patient's name and irreversibility", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("delete-button"));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, message] = alertSpy.mock.calls[0];
    expect(title).toMatch(/supprimer/i);
    expect(message).toContain(SAMPLE_PATIENT_DETAIL.name);
    expect(message).toMatch(/irréversible/i);
    // onDelete must not fire until the user confirms.
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("calls onDelete only when the destructive confirmation button is pressed", () => {
    const onDelete = jest.fn();
    jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      const confirmBtn = buttons?.find((b) => b.style === "destructive");
      confirmBtn?.onPress?.();
    });
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("delete-button"));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("does not call onDelete when the confirmation is cancelled", () => {
    const onDelete = jest.fn();
    jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
      const cancelBtn = buttons?.find((b) => b.style === "cancel");
      cancelBtn?.onPress?.();
    });
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onDelete={onDelete} />,
    );

    fireEvent.press(getByTestId("delete-button"));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it("asks for confirmation before archiving, mentioning the patient's name", () => {
    const onArchive = jest.fn();
    jest.spyOn(Alert, "alert").mockImplementation((_title, message, buttons) => {
      expect(message).toContain(SAMPLE_PATIENT_DETAIL.name);
      const confirmBtn = buttons?.find((b) => b.text !== "Annuler");
      confirmBtn?.onPress?.();
    });
    const { getByTestId } = render(
      <PatientDetail data={SAMPLE_PATIENT_DETAIL} onArchive={onArchive} />,
    );

    fireEvent.press(getByTestId("archive-button"));

    expect(onArchive).toHaveBeenCalledTimes(1);
  });
});

describe("PatientDetail — entrée vers le rapport de progression", () => {
  it("affiche le lien quand le patient a au moins 2 analyses et un handler est fourni", () => {
    const onProgressionReport = jest.fn();
    const { getByTestId } = render(
      <PatientDetail
        data={{ ...SAMPLE_PATIENT_DETAIL, analysisCount: 2 }}
        onProgressionReport={onProgressionReport}
      />,
    );
    expect(getByTestId("progression-report-link")).toBeTruthy();
  });

  it("masque le lien quand le patient a moins de 2 analyses", () => {
    const { queryByTestId } = render(
      <PatientDetail
        data={{ ...SAMPLE_PATIENT_DETAIL, analysisCount: 1 }}
        onProgressionReport={jest.fn()}
      />,
    );
    expect(queryByTestId("progression-report-link")).toBeNull();
  });

  it("masque le lien quand aucun handler n'est fourni, même avec assez d'analyses", () => {
    const { queryByTestId } = render(
      <PatientDetail data={{ ...SAMPLE_PATIENT_DETAIL, analysisCount: 5 }} />,
    );
    expect(queryByTestId("progression-report-link")).toBeNull();
  });

  it("appelle onProgressionReport au clic sur le lien", () => {
    const onProgressionReport = jest.fn();
    const { getByTestId } = render(
      <PatientDetail
        data={{ ...SAMPLE_PATIENT_DETAIL, analysisCount: 3 }}
        onProgressionReport={onProgressionReport}
      />,
    );

    fireEvent.press(getByTestId("progression-report-link"));

    expect(onProgressionReport).toHaveBeenCalledTimes(1);
  });
});
