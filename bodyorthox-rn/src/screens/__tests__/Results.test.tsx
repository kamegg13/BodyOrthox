import React from "react";
import { render } from "@testing-library/react-native";
import { Results, SAMPLE_RESULTS } from "../Results";

describe("Results", () => {
  it("rend un AngleScale sous chaque mesure HKA", () => {
    const { getByTestId } = render(<Results data={SAMPLE_RESULTS} />);
    expect(getByTestId("angle-scale-hka-l")).toBeTruthy();
    expect(getByTestId("angle-scale-hka-r")).toBeTruthy();
  });

  it("n'affiche pas de curseur quand la mesure HKA est indisponible", () => {
    const data = {
      ...SAMPLE_RESULTS,
      hka: {
        left: { ...SAMPLE_RESULTS.hka.left, value: null },
        right: SAMPLE_RESULTS.hka.right,
      },
    };
    const { getByTestId } = render(<Results data={data} />);
    expect(getByTestId("angle-scale-hka-l-empty")).toBeTruthy();
  });

  it("affiche les deux côtés pour chaque mesure posturale", () => {
    const { getByTestId } = render(<Results data={SAMPLE_RESULTS} />);
    for (const m of SAMPLE_RESULTS.postural) {
      expect(getByTestId(`postural-${m.key}-left`)).toBeTruthy();
      expect(getByTestId(`postural-${m.key}-right`)).toBeTruthy();
    }
  });

  it("affiche — quand un côté postural est indisponible", () => {
    const first = SAMPLE_RESULTS.postural[0];
    const data = {
      ...SAMPLE_RESULTS,
      postural: [{ ...first, right: null }],
    };
    const { getByTestId } = render(<Results data={data} />);
    expect(getByTestId(`postural-${first.key}-right`)).toHaveTextContent("—");
  });

  it("rend la photo dans une image zoomable quand elle est fournie", () => {
    const data = {
      ...SAMPLE_RESULTS,
      capturedImageUrl: "data:image/png;base64,abc",
    };
    const { getByTestId } = render(<Results data={data} />);
    expect(getByTestId("zoomable-image")).toBeTruthy();
    expect(getByTestId("zoomable-image-slider")).toBeTruthy();
  });
});
