import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { AnimatedPressableButton } from "../animated-pressable";

describe("AnimatedPressableButton", () => {
  it("renders children", () => {
    const { getByText } = render(
      <AnimatedPressableButton>
        <Text>Press me</Text>
      </AnimatedPressableButton>,
    );
    expect(getByText("Press me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedPressableButton onPress={onPress} testID="btn">
        <Text>Press me</Text>
      </AnimatedPressableButton>,
    );
    fireEvent.press(getByText("Press me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("accepts custom scaleOnPress prop", () => {
    const { getByText } = render(
      <AnimatedPressableButton scaleOnPress={0.95}>
        <Text>Scaled</Text>
      </AnimatedPressableButton>,
    );
    expect(getByText("Scaled")).toBeTruthy();
  });

  it("forwards testID to the pressable", () => {
    const { getByTestId } = render(
      <AnimatedPressableButton testID="animated-btn">
        <Text>Test</Text>
      </AnimatedPressableButton>,
    );
    expect(getByTestId("animated-btn")).toBeTruthy();
  });
});
