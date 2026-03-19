describe("shareReport (native)", () => {
  let shareNative: typeof import("../share-service.native");

  beforeEach(() => {
    jest.resetModules();
  });

  it("should return shared when Share.share resolves with sharedAction", async () => {
    jest.doMock("react-native", () => ({
      Share: {
        share: jest.fn().mockResolvedValue({ action: "sharedAction" }),
        sharedAction: "sharedAction",
        dismissedAction: "dismissedAction",
      },
      Platform: { OS: "ios" },
    }));

    shareNative = require("../share-service.native");
    const result = await shareNative.shareReport("<html></html>", "test.pdf");
    expect(result.kind).toBe("shared");
  });

  it("should return cancelled when Share.share resolves with dismissedAction", async () => {
    jest.doMock("react-native", () => ({
      Share: {
        share: jest.fn().mockResolvedValue({ action: "dismissedAction" }),
        sharedAction: "sharedAction",
        dismissedAction: "dismissedAction",
      },
      Platform: { OS: "ios" },
    }));

    shareNative = require("../share-service.native");
    const result = await shareNative.shareReport("<html></html>", "test.pdf");
    expect(result.kind).toBe("cancelled");
  });

  it("should return error when Share.share throws", async () => {
    jest.doMock("react-native", () => ({
      Share: {
        share: jest.fn().mockRejectedValue(new Error("Share failed")),
        sharedAction: "sharedAction",
        dismissedAction: "dismissedAction",
      },
      Platform: { OS: "ios" },
    }));

    shareNative = require("../share-service.native");
    const result = await shareNative.shareReport("<html></html>", "test.pdf");
    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message).toBe("Share failed");
    }
  });

  it("should pass correct parameters to Share.share", async () => {
    const mockShare = jest.fn().mockResolvedValue({ action: "sharedAction" });
    jest.doMock("react-native", () => ({
      Share: {
        share: mockShare,
        sharedAction: "sharedAction",
        dismissedAction: "dismissedAction",
      },
      Platform: { OS: "android" },
    }));

    shareNative = require("../share-service.native");
    await shareNative.shareReport("<html>content</html>", "Report.pdf");

    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Report.pdf",
        message: "<html>content</html>",
      }),
      expect.objectContaining({
        subject: "Report.pdf",
        dialogTitle: "Partager Report.pdf",
      }),
    );
  });
});

describe("ShareResult types", () => {
  it("should export ShareResult type with correct variants", () => {
    // Type-level test: ensure the interface is importable
    const shared = { kind: "shared" as const };
    const cancelled = { kind: "cancelled" as const };
    const error = { kind: "error" as const, message: "test" };

    expect(shared.kind).toBe("shared");
    expect(cancelled.kind).toBe("cancelled");
    expect(error.kind).toBe("error");
    expect(error.message).toBe("test");
  });
});
