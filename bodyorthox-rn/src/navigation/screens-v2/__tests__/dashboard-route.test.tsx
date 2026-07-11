import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { DashboardRoute } from "../dashboard-route";
import { useAuthStore } from "../../../core/auth/auth-store";
import { usePatientsStore } from "../../../features/patients/store/patients-store";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("DashboardRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePatientsStore.setState({ patients: [], isLoading: false, error: null, searchQuery: "" });
    useAuthStore.setState({
      user: { firstName: "Marie", lastName: "Curie", email: "marie@example.com" },
    } as any);
  });

  it("navigue vers l'onglet Patients quand on presse « Nouvelle capture »", () => {
    const { getByLabelText } = render(<DashboardRoute />);
    fireEvent.press(getByLabelText("Capture"));
    expect(mockNavigate).toHaveBeenCalledWith("MainTabs", { screen: "PatientsTab" });
  });

  it("navigue vers CreatePatient pour l'action « Nouveau patient »", () => {
    const { getByLabelText } = render(<DashboardRoute />);
    fireEvent.press(getByLabelText("Nouveau patient"));
    expect(mockNavigate).toHaveBeenCalledWith("CreatePatient");
  });
});
