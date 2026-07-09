import React from "react";
import { render } from "@testing-library/react-native";
import { Report, SAMPLE_REPORT } from "../Report";

describe("Report", () => {
  it("rend un AngleScale sous chaque ligne HKA du tableau de mesures", () => {
    const { getByTestId } = render(<Report data={SAMPLE_REPORT} />);
    expect(getByTestId("angle-scale-report-row-0")).toBeTruthy();
    expect(getByTestId("angle-scale-report-row-1")).toBeTruthy();
  });

  it("n'affiche pas de scale sous les lignes non-HKA", () => {
    const { queryByTestId } = render(<Report data={SAMPLE_REPORT} />);
    // Index 2 = "Inclin. épaules", sans angleRefMin/angleRefMax.
    expect(queryByTestId("angle-scale-report-row-2")).toBeNull();
  });
});
