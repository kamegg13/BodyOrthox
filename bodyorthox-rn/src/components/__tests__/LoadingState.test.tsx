import React from "react";
import { render } from "@testing-library/react-native";
import { LoadingState } from "../LoadingState";

describe("LoadingState", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<LoadingState />);
    expect(toJSON()).toBeTruthy();
  });

  it("shows a message when provided", () => {
    const { getByText } = render(<LoadingState message="Chargement…" />);
    expect(getByText("Chargement…")).toBeTruthy();
  });

  it("does not show a message when not provided", () => {
    const { queryByText } = render(<LoadingState />);
    expect(queryByText("Chargement…")).toBeNull();
  });

  it("renders fullScreen and small variants", () => {
    expect(render(<LoadingState fullScreen />).toJSON()).toBeTruthy();
    expect(render(<LoadingState size="small" />).toJSON()).toBeTruthy();
  });

  it("exposes testID", () => {
    const { getByTestId } = render(<LoadingState testID="loading" />);
    expect(getByTestId("loading")).toBeTruthy();
  });
});
