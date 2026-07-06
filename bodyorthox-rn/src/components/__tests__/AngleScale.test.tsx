import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import type { ReactTestInstance } from "react-test-renderer";
import { AngleScale } from "../AngleScale";

/** Déclenche un onLayout pour donner une largeur mesurable à la règle. */
function layout(node: ReactTestInstance) {
  fireEvent(node, "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 60 } },
  });
}

describe("AngleScale", () => {
  it("rend le curseur et la valeur quand la mesure est dans la plage", () => {
    const { getByTestId, queryByTestId } = render(
      <AngleScale value={180} refMin={177} refMax={183} testID="scale" />,
    );
    layout(getByTestId("scale"));

    expect(getByTestId("scale-value")).toBeTruthy();
    expect(getByTestId("scale-cursor")).toBeTruthy();
    expect(queryByTestId("scale-empty")).toBeNull();
  });

  it("affiche la valeur en degrés", () => {
    const { getByTestId, getByText } = render(
      <AngleScale value={186} testID="scale" />,
    );
    layout(getByTestId("scale"));
    expect(getByText("186°")).toBeTruthy();
  });

  it("borne le curseur mais conserve la valeur réelle hors plage", () => {
    const { getByTestId, getByText } = render(
      <AngleScale value={205} min={165} max={195} testID="scale" />,
    );
    layout(getByTestId("scale"));
    // Curseur présent (borné à la règle) et valeur réelle affichée telle quelle.
    expect(getByTestId("scale-cursor")).toBeTruthy();
    expect(getByText("205°")).toBeTruthy();
  });

  it("ne fabrique aucune valeur quand value est null", () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <AngleScale value={null} testID="scale" />,
    );
    layout(getByTestId("scale"));
    expect(getByTestId("scale-empty")).toBeTruthy();
    expect(getByText("—")).toBeTruthy();
    expect(queryByTestId("scale-cursor")).toBeNull();
    expect(queryByTestId("scale-value")).toBeNull();
  });

  it("rend les labels des ticks majeurs", () => {
    const { getByTestId, getByText } = render(
      <AngleScale value={180} min={165} max={195} testID="scale" />,
    );
    layout(getByTestId("scale"));
    // Majeurs tous les 5° : bornes et centre.
    expect(getByText("165")).toBeTruthy();
    expect(getByText("180")).toBeTruthy();
    expect(getByText("195")).toBeTruthy();
  });

  it("rend la bande de plage de référence quand fournie", () => {
    const { getByTestId } = render(
      <AngleScale value={180} refMin={177} refMax={183} testID="scale" />,
    );
    layout(getByTestId("scale"));
    expect(getByTestId("scale-band")).toBeTruthy();
  });

  it("n'affiche pas de bande sans références", () => {
    const { getByTestId, queryByTestId } = render(
      <AngleScale value={180} testID="scale" />,
    );
    layout(getByTestId("scale"));
    expect(queryByTestId("scale-band")).toBeNull();
  });
});
