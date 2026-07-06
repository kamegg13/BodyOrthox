import {
  getActiveCalibrationModel,
  __resetCalibrationStoreForTests,
  useCalibrationStore,
} from "../calibration-store";
import type { CalibrationModel } from "../calibration-types";

const model: CalibrationModel = {
  version: 1,
  createdAt: "2026-06-06T00:00:00.000Z",
  left: { kind: "offset", coefficients: { a: 1, b: -3 }, n: 12 },
  right: { kind: "linear", coefficients: { a: 1.1, b: -20 }, n: 12 },
};

beforeEach(() => {
  __resetCalibrationStoreForTests();
  useCalibrationStore.getState().deactivate();
  __resetCalibrationStoreForTests();
});

describe("calibration-store", () => {
  it("has no active model by default", () => {
    expect(getActiveCalibrationModel()).toBeNull();
    expect(useCalibrationStore.getState().activeModel).toBeNull();
  });

  it("activates a model and exposes it synchronously", () => {
    useCalibrationStore.getState().activate(model);
    expect(useCalibrationStore.getState().activeModel).toEqual(model);
    expect(getActiveCalibrationModel()).toEqual(model);
  });

  it("deactivates back to raw output", () => {
    useCalibrationStore.getState().activate(model);
    useCalibrationStore.getState().deactivate();
    expect(useCalibrationStore.getState().activeModel).toBeNull();
    expect(getActiveCalibrationModel()).toBeNull();
  });
});
