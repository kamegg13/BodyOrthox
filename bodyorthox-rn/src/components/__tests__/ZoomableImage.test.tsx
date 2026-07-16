import React from "react";
import { StyleSheet, Text, View } from "react-native";
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
    expect(scaleOf(getByTestId("zoomable-image-transform"))).toBe(1);
  });

  it("augmente le zoom via l'action d'accessibilité increment", () => {
    const { getByTestId } = render(<ZoomableImage uri={URI} />);
    fireEvent(getByTestId("zoomable-image-slider"), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });
    expect(scaleOf(getByTestId("zoomable-image-transform"))).toBeGreaterThan(1);
  });

  it("ne descend jamais sous 1× via decrement", () => {
    const { getByTestId } = render(<ZoomableImage uri={URI} />);
    const slider = getByTestId("zoomable-image-slider");
    fireEvent(slider, "accessibilityAction", {
      nativeEvent: { actionName: "decrement" },
    });
    expect(scaleOf(getByTestId("zoomable-image-transform"))).toBe(1);
  });

  it("plafonne le zoom au maximum", () => {
    const { getByTestId } = render(<ZoomableImage uri={URI} maxZoom={2} />);
    const slider = getByTestId("zoomable-image-slider");
    for (let i = 0; i < 10; i += 1) {
      fireEvent(slider, "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });
    }
    expect(scaleOf(getByTestId("zoomable-image-transform"))).toBe(2);
  });

  it("expose une valeur d'accessibilité ENTIÈRE (Fabric convertit en Int32 : un scale fractionnaire crashe le rendu natif)", () => {
    const { getByTestId } = render(<ZoomableImage uri={URI} />);
    const slider = getByTestId("zoomable-image-slider");
    fireEvent(slider, "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });

    const value = slider.props.accessibilityValue as { now: number };
    expect(scaleOf(getByTestId("zoomable-image-transform"))).toBe(1.5);
    expect(Number.isInteger(value.now)).toBe(true);
  });

  it("affiche la légende quand elle est fournie", () => {
    const { getByText } = render(
      <ZoomableImage uri={URI} caption="Capture · 24 avr 2026" />,
    );
    expect(getByText("Capture · 24 avr 2026")).toBeTruthy();
  });

  describe("renderOverlay", () => {
    it("rend l'overlay avec la taille mesurée du conteneur", () => {
      const { getByTestId } = render(
        <ZoomableImage
          uri={URI}
          renderOverlay={({ width, height }) => (
            <View testID="test-overlay">
              <Text>{`${width}x${height}`}</Text>
            </View>
          )}
        />,
      );

      fireEvent(getByTestId("zoomable-image-root"), "layout", {
        nativeEvent: { layout: { width: 320, height: 240 } },
      });

      expect(getByTestId("test-overlay")).toBeTruthy();
      expect(getByTestId("zoomable-image-transform")).toBeTruthy();
    });

    it("n'appelle pas renderOverlay avant la mesure du conteneur", () => {
      const renderOverlay = jest.fn(() => null);
      render(<ZoomableImage uri={URI} renderOverlay={renderOverlay} />);
      expect(renderOverlay).not.toHaveBeenCalled();
    });

    it("l'overlay suit le zoom : il vit dans le conteneur transformé", () => {
      const { getByTestId } = render(
        <ZoomableImage
          uri={URI}
          renderOverlay={() => <View testID="test-overlay" />}
        />,
      );
      fireEvent(getByTestId("zoomable-image-root"), "layout", {
        nativeEvent: { layout: { width: 320, height: 240 } },
      });

      fireEvent(getByTestId("zoomable-image-slider"), "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });

      // Le scale s'applique au wrapper commun (image + overlay), donc
      // l'overlay reste aligné sur la photo pendant le zoom.
      expect(scaleOf(getByTestId("zoomable-image-transform"))).toBeGreaterThan(1);
      expect(scaleOf(getByTestId("zoomable-image"))).toBe(1);
    });
  });
});
