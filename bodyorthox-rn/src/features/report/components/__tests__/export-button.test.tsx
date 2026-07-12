import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ExportButton } from "../export-button";

// Mock share-service
const mockShareReport = jest.fn();
jest.mock("../../data/share-service", () => ({
  shareReport: (...args: unknown[]) => mockShareReport(...args),
}));

// Mock privacy-confirm — confirmé par défaut, chaque test peut le surcharger
// pour vérifier le cas d'annulation.
const mockConfirmPrivacy = jest.fn();
jest.mock("../../data/privacy-confirm", () => ({
  confirmPrivacyBeforeShare: () => mockConfirmPrivacy(),
}));

describe("ExportButton", () => {
  beforeEach(() => {
    mockShareReport.mockReset();
    mockShareReport.mockResolvedValue({ kind: "shared" });
    mockConfirmPrivacy.mockReset();
    mockConfirmPrivacy.mockResolvedValue(true);
  });

  it("should render the export button with correct text", () => {
    const { getByText } = render(
      <ExportButton htmlContent="<html></html>" fileName="test.pdf" />,
    );
    expect(getByText("Exporter")).toBeTruthy();
  });

  it("should have accessibility label", () => {
    const { getByLabelText } = render(
      <ExportButton htmlContent="<html></html>" fileName="test.pdf" />,
    );
    expect(getByLabelText("Exporter le rapport")).toBeTruthy();
  });

  it("should show the privacy warning before sharing, then call shareReport with correct params", async () => {
    const { getByTestId } = render(
      <ExportButton htmlContent="<html>content</html>" fileName="Report.pdf" />,
    );

    fireEvent.press(getByTestId("export-button"));

    await waitFor(() => {
      expect(mockConfirmPrivacy).toHaveBeenCalled();
      expect(mockShareReport).toHaveBeenCalledWith(
        "<html>content</html>",
        "Report.pdf",
      );
    });
  });

  it("should not call shareReport when the user cancels the privacy warning", async () => {
    mockConfirmPrivacy.mockResolvedValue(false);

    const { getByTestId } = render(
      <ExportButton htmlContent="<html></html>" fileName="test.pdf" />,
    );

    fireEvent.press(getByTestId("export-button"));

    await waitFor(() => {
      expect(mockConfirmPrivacy).toHaveBeenCalled();
    });
    expect(mockShareReport).not.toHaveBeenCalled();
  });

  it("should show error message when share fails", async () => {
    mockShareReport.mockResolvedValue({
      kind: "error",
      message: "Partage impossible",
    });

    const { getByTestId, findByTestId } = render(
      <ExportButton htmlContent="<html></html>" fileName="test.pdf" />,
    );

    fireEvent.press(getByTestId("export-button"));

    const errorText = await findByTestId("export-error");
    expect(errorText.props.children).toBe("Partage impossible");
  });

  it("should show a retry button on error, which re-attempts the share", async () => {
    mockShareReport
      .mockResolvedValueOnce({ kind: "error", message: "Partage impossible" })
      .mockResolvedValueOnce({ kind: "shared" });

    const { getByTestId, findByTestId, queryByTestId } = render(
      <ExportButton htmlContent="<html></html>" fileName="test.pdf" />,
    );

    fireEvent.press(getByTestId("export-button"));
    await findByTestId("export-error");

    const retryButton = await findByTestId("export-retry");
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(mockShareReport).toHaveBeenCalledTimes(2);
      expect(queryByTestId("export-error")).toBeNull();
    });
  });

  it("should not show error when share is cancelled", async () => {
    mockShareReport.mockResolvedValue({ kind: "cancelled" });

    const { getByTestId, queryByTestId } = render(
      <ExportButton htmlContent="<html></html>" fileName="test.pdf" />,
    );

    fireEvent.press(getByTestId("export-button"));

    await waitFor(() => {
      expect(queryByTestId("export-error")).toBeNull();
    });
  });

  it("should be disabled when disabled prop is true", () => {
    const { getByTestId } = render(
      <ExportButton htmlContent="<html></html>" fileName="test.pdf" disabled />,
    );

    fireEvent.press(getByTestId("export-button"));
    expect(mockShareReport).not.toHaveBeenCalled();
  });

  it("should show spinner while sharing", async () => {
    // Make shareReport hang
    mockShareReport.mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = render(
      <ExportButton htmlContent="<html></html>" fileName="test.pdf" />,
    );

    fireEvent.press(getByTestId("export-button"));

    await waitFor(() => {
      expect(getByTestId("export-spinner")).toBeTruthy();
    });
  });
});
