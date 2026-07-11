import React from "react";
import { render } from "@testing-library/react-native";
import { Field } from "../Field";

describe("Field — autofill (gestionnaires de mots de passe)", () => {
  it("email : propose emailAddress / email à l'autofill", () => {
    const { getByTestId } = render(
      <Field type="email" testID="f-email" onChangeText={() => {}} />,
    );
    const input = getByTestId("f-email");
    expect(input.props.textContentType).toBe("emailAddress");
    expect(input.props.autoComplete).toBe("email");
  });

  it("password : propose password / current-password à l'autofill", () => {
    const { getByTestId } = render(
      <Field type="password" testID="f-password" onChangeText={() => {}} />,
    );
    const input = getByTestId("f-password");
    expect(input.props.textContentType).toBe("password");
    expect(input.props.autoComplete).toBe("current-password");
  });

  it("text : désactive l'autofill par défaut (none / off)", () => {
    const { getByTestId } = render(
      <Field type="text" testID="f-text" onChangeText={() => {}} />,
    );
    const input = getByTestId("f-text");
    expect(input.props.textContentType).toBe("none");
    expect(input.props.autoComplete).toBe("off");
  });

  it("permet de surcharger explicitement textContentType/autoComplete", () => {
    const { getByTestId } = render(
      <Field
        type="password"
        testID="f-new-password"
        onChangeText={() => {}}
        textContentType="newPassword"
        autoComplete="new-password"
      />,
    );
    const input = getByTestId("f-new-password");
    expect(input.props.textContentType).toBe("newPassword");
    expect(input.props.autoComplete).toBe("new-password");
  });
});
