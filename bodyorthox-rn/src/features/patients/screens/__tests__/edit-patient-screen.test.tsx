import React from "react";
import { render } from "@testing-library/react-native";
import { EditPatientScreen } from "../edit-patient-screen";

const mockPatient = {
  id: "p1",
  name: "Jean Dupont",
  dateOfBirth: "1990-01-01",
  morphologicalProfile: { sex: "male" as const },
  createdAt: "2024-01-01T00:00:00Z",
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({ params: { patientId: "p1" } }),
}));

jest.mock("../../store/patients-store", () => ({
  usePatientsStore: jest.fn((selector: any) =>
    selector({
      patients: [mockPatient],
      updatePatient: jest.fn().mockResolvedValue(undefined),
    })
  ),
}));

jest.mock("../patient-form-screen", () => ({
  PatientFormScreen: ({ mode, initialValues }: any) =>
    require("react").createElement(require("react-native").View, {
      testID: `patient-form-${mode}`,
      accessibilityLabel: initialValues?.firstName,
    }),
}));

describe("EditPatientScreen", () => {
  it("renders PatientFormScreen in edit mode with pre-filled values", () => {
    const { getByTestId } = render(<EditPatientScreen />);
    expect(getByTestId("patient-form-edit")).toBeTruthy();
  });

  it("passes correct initialValues from patient", () => {
    const { getByTestId } = render(<EditPatientScreen />);
    const form = getByTestId("patient-form-edit");
    expect(form.props.accessibilityLabel).toBe("Jean");
  });
});
