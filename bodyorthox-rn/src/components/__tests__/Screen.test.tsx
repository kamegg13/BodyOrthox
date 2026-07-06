import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Screen } from "../Screen";
import { colors } from "../../theme/tokens";

/** Aplati un style RN (objet ou tableau imbriqué) en un seul objet. */
function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce(
      (acc, s) => ({ ...acc, ...flattenStyle(s) }),
      {} as Record<string, unknown>,
    );
  }
  return (style as Record<string, unknown>) ?? {};
}

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderInSafeArea(node: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={metrics}>{node}</SafeAreaProvider>);
}

describe("Screen", () => {
  it("renders children", () => {
    const { getByText } = renderInSafeArea(
      <Screen>
        <Text>Contenu</Text>
      </Screen>,
    );
    expect(getByText("Contenu")).toBeTruthy();
  });

  it("renders a NavBar title when title is provided", () => {
    const { getByText } = renderInSafeArea(<Screen title="Réglages" />);
    expect(getByText("Réglages")).toBeTruthy();
  });

  it("shows a back button and calls onBack", () => {
    const onBack = jest.fn();
    const { getByLabelText } = renderInSafeArea(
      <Screen title="Détail" onBack={onBack} />,
    );
    fireEvent.press(getByLabelText("Retour"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("exposes testID", () => {
    const { getByTestId } = renderInSafeArea(
      <Screen testID="screen-root" title="X" />,
    );
    expect(getByTestId("screen-root")).toBeTruthy();
  });

  it("uses the light background by default", () => {
    const { getByTestId } = renderInSafeArea(
      <Screen testID="screen-root" title="X" />,
    );
    const style = flattenStyle(getByTestId("screen-root").props.style);
    expect(style["backgroundColor"]).toBe(colors.bg);
  });

  it("uses the capture background in dark variant", () => {
    const { getByTestId } = renderInSafeArea(
      <Screen testID="screen-root" title="X" variant="dark" />,
    );
    const style = flattenStyle(getByTestId("screen-root").props.style);
    expect(style["backgroundColor"]).toBe(colors.captureBg);
  });
});
