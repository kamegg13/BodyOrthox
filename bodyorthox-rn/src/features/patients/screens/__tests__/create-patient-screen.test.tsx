import React from "react";
import { render } from "@testing-library/react-native";
import { CreatePatientScreen } from "../create-patient-screen";

jest.mock("../patient-form-screen", () => ({
  PatientFormScreen: ({ mode }: { mode: string }) =>
    require("react").createElement(require("react-native").View, { testID: `patient-form-${mode}` }),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));

jest.mock("../../store/patients-store", () => ({
  usePatientsStore: () => ({ createPatient: jest.fn().mockResolvedValue({}) }),
}));

describe("CreatePatientScreen", () => {
  it("renders PatientFormScreen in create mode", () => {
    const { getByTestId } = render(<CreatePatientScreen />);
    expect(getByTestId("patient-form-create")).toBeTruthy();
  });
});
