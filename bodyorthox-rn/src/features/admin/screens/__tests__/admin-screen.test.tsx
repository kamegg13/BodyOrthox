import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { AdminScreen } from "../admin-screen";
import { apiRequest } from "../../../../core/api/api-client";

jest.mock("../../../../core/api/api-client", () => ({
  apiRequest: jest.fn(),
}));

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ goBack: mockGoBack }),
}));

describe("AdminScreen — états partagés (LoadingState/EmptyState)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche LoadingState (pas d'ActivityIndicator ad hoc) pendant le chargement", () => {
    (apiRequest as jest.Mock).mockReturnValue(new Promise(() => {})); // pending forever
    const { getByTestId } = render(<AdminScreen />);
    expect(getByTestId("admin-loading")).toBeTruthy();
  });

  it("affiche EmptyState quand la liste des comptes est vide", async () => {
    (apiRequest as jest.Mock).mockResolvedValue([]);
    const { getByTestId } = render(<AdminScreen />);

    await waitFor(() => expect(getByTestId("admin-empty")).toBeTruthy());
  });

  it("les champs email/mot de passe portent les props d'autofill", async () => {
    (apiRequest as jest.Mock).mockResolvedValue([]);
    const { getByTestId } = render(<AdminScreen />);
    await waitFor(() => expect(getByTestId("admin-empty")).toBeTruthy());

    const emailInput = getByTestId("admin-new-email");
    const passwordInput = getByTestId("admin-new-password");
    expect(emailInput.props.textContentType).toBe("emailAddress");
    expect(emailInput.props.autoComplete).toBe("email");
    expect(passwordInput.props.textContentType).toBe("newPassword");
    expect(passwordInput.props.autoComplete).toBe("new-password");
  });
});
