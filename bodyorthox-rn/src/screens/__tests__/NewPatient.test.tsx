import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { NewPatient } from "../NewPatient";

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
