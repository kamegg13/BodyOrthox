import AsyncStorage from "@react-native-async-storage/async-storage";
import { installAsyncStorageBackend } from "../async-storage-backend";
import {
  getKeyValueStorage,
  whenStorageReady,
  __resetKeyValueStorage,
} from "../key-value-storage";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("async-storage-backend", () => {
  afterEach(async () => {
    await AsyncStorage.clear();
    __resetKeyValueStorage();
    jest.restoreAllMocks();
  });

  it("hydrates existing AsyncStorage values into the seam", async () => {
    await AsyncStorage.setItem("onboarding_completed", "true");

    await installAsyncStorageBackend();

    expect(getKeyValueStorage().getItem("onboarding_completed")).toBe("true");
  });

  it("returns null for absent keys after hydration", async () => {
    await installAsyncStorageBackend();

    expect(getKeyValueStorage().getItem("missing")).toBeNull();
  });

  it("writes through to AsyncStorage on setItem", async () => {
    await installAsyncStorageBackend();

    getKeyValueStorage().setItem("calibration", "model-v1");
    await Promise.resolve(); // laisse le write-through différé s'exécuter

    expect(getKeyValueStorage().getItem("calibration")).toBe("model-v1");
    await expect(AsyncStorage.getItem("calibration")).resolves.toBe(
      "model-v1",
    );
  });

  it("removes from memory and AsyncStorage on removeItem", async () => {
    await AsyncStorage.setItem("calibration", "model-v1");
    await installAsyncStorageBackend();

    getKeyValueStorage().removeItem("calibration");
    await Promise.resolve();

    expect(getKeyValueStorage().getItem("calibration")).toBeNull();
    await expect(AsyncStorage.getItem("calibration")).resolves.toBeNull();
  });

  it("whenStorageReady resolves only after hydration installed the backend", async () => {
    await AsyncStorage.setItem("onboarding_completed", "true");

    installAsyncStorageBackend();
    await whenStorageReady();

    expect(getKeyValueStorage().getItem("onboarding_completed")).toBe("true");
  });

  it("starts empty when hydration fails but keeps accepting writes", async () => {
    jest
      .spyOn(AsyncStorage, "getAllKeys")
      .mockRejectedValueOnce(new Error("corrupted"));

    await installAsyncStorageBackend();

    expect(getKeyValueStorage().getItem("onboarding_completed")).toBeNull();
    getKeyValueStorage().setItem("onboarding_completed", "true");
    expect(getKeyValueStorage().getItem("onboarding_completed")).toBe("true");
  });
});
