import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { ZoomableImage } from "../ZoomableImage";

const URI = "data:image/png;base64,abc";

/** Extrait le facteur de scale appliqué à l'image zoomable. */
function scaleOf(image: { props: { style: unknown } }): number {
  const flat = StyleSheet.flatten(image.props.style) as {
    transform?: ReadonlyArray<Record<string, number>>;
  };
  const entry = flat.transform?.find((t) => "scale" in t);
  return entry ? entry.scale : 1;
}

describe("ZoomableImage", () => {
  it("rend l'image et le curseur de zoom", () => {
    const { getByTestId } = render(<ZoomableImage uri={URI} />);
    expect(getByTestId("zoomable-image")).toBeTruthy();
    expect(getByTestId("zoomable-image-slider")).toBeTruthy();
  });

  it("démarre à zoom 1× sans translation", () => {
    const { getByTestId } = render(<ZoomableImage uri={URI} />);
    expect(scaleOf(getByTestId("zoomable-image"))).toBe(1);
  });

  it("augmente le zoom via l'action d'accessibilité increment", () => {
    const { getByTestId } = render(<ZoomableImage uri={URI} />);
    fireEvent(getByTestId("zoomable-image-slider"), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(scaleOf(getByTestId("zoomable-image"))).toBeGreaterThan(1);
  });

  it("ne descend jamais sous 1× via decrement", () => {
    const { getByTestId } = render(<ZoomableImage uri={URI} />);
    const slider = getByTestId("zoomable-image-slider");
    fireEvent(slider, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });
    expect(scaleOf(getByTestId("zoomable-image"))).toBe(1);
  });

  it("plafonne le zoom au maximum", () => {
    const { getByTestId } = render(<ZoomableImage uri={URI} maxZoom={2} />);
    const slider = getByTestId("zoomable-image-slider");
    for (let i = 0; i < 10; i += 1) {
      fireEvent(slider, "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });
    }
    expect(scaleOf(getByTestId("zoomable-image"))).toBe(2);
  });

  it("affiche la légende quand elle est fournie", () => {
    const { getByText } = render(
      <ZoomableImage uri={URI} caption="Capture · 24 avr 2026" />,
    );
    expect(getByText("Capture · 24 avr 2026")).toBeTruthy();
  });
});
