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
});
