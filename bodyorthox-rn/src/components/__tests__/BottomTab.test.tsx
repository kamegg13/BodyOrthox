import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { BottomTab, TABS } from "../BottomTab";

describe("BottomTab — bouton capture central", () => {
  it("expose 5 onglets avec Capture en position centrale", () => {
    expect(TABS).toHaveLength(5);
    expect(TABS[2]?.key).toBe("capture");
    expect(TABS.map((t) => t.key)).toEqual([
      "home",
      "patients",
      "capture",
      "reports",
      "settings",
    ]);
  });

  it("rend chaque onglet avec icône et label texte", () => {
    const { getByText } = render(<BottomTab active="home" />);
    for (const tab of TABS) {
      expect(getByText(tab.label)).toBeTruthy();
    }
  });

  it("déclenche onPress('capture') au tap sur le bouton central", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<BottomTab active="home" onPress={onPress} />);

    fireEvent.press(getByTestId("tab-capture"));

    expect(onPress).toHaveBeenCalledWith("capture");
  });

  it("marque l'onglet actif comme sélectionné pour l'accessibilité", () => {
    const { getByLabelText } = render(<BottomTab active="patients" />);
    expect(getByLabelText("Patients").props.accessibilityState).toEqual({
      selected: true,
    });
    expect(getByLabelText("Accueil").props.accessibilityState).toEqual({
      selected: false,
    });
  });
});
