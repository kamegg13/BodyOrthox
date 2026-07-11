function mockRNShare(openImpl: jest.Mock) {
  jest.doMock("react-native-share", () => ({
    __esModule: true,
    default: { open: openImpl },
  }));
}

function mockHtmlToPdf(convertImpl: jest.Mock) {
  jest.doMock("react-native-html-to-pdf", () => ({
    __esModule: true,
    default: { convert: convertImpl },
  }));
}

describe("shareReport (native)", () => {
  let shareNative: typeof import("../share-service.native");

  beforeEach(() => {
    jest.resetModules();
  });

  it("should generate a real PDF file and share it (not raw HTML)", async () => {
    const mockOpen = jest.fn().mockResolvedValue({ success: true, message: "" });
    const mockConvert = jest
      .fn()
      .mockResolvedValue({ filePath: "/cache/report.pdf" });
    mockRNShare(mockOpen);
    mockHtmlToPdf(mockConvert);

    shareNative = require("../share-service.native");
    const result = await shareNative.shareReport("<html>content</html>", "Report.pdf");

    expect(mockConvert).toHaveBeenCalledWith(
      expect.objectContaining({ html: "<html>content</html>", fileName: "Report" }),
    );
    // Le HTML brut ne doit jamais être passé au partage : seul le fichier
    // généré l'est, en PDF, via react-native-share (le Share de RN core
    // ignore `url` sur Android).
    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "file:///cache/report.pdf",
        type: "application/pdf",
        failOnCancel: false,
      }),
    );
    const openArgs = mockOpen.mock.calls[0][0];
    expect(openArgs.message).toBeUndefined();
    expect(result.kind).toBe("shared");
  });

  it("should not double the file:// prefix when the library already returns one", async () => {
    const mockOpen = jest.fn().mockResolvedValue({ success: true, message: "" });
    const mockConvert = jest
      .fn()
      .mockResolvedValue({ filePath: "file:///tmp/report.pdf" });
    mockRNShare(mockOpen);
    mockHtmlToPdf(mockConvert);

    shareNative = require("../share-service.native");
    await shareNative.shareReport("<html></html>", "Report.pdf");

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({ url: "file:///tmp/report.pdf" }),
    );
  });

  it("should return cancelled when the share sheet is dismissed", async () => {
    const mockOpen = jest
      .fn()
      .mockResolvedValue({ success: false, dismissedAction: true, message: "" });
    const mockConvert = jest
      .fn()
      .mockResolvedValue({ filePath: "/cache/report.pdf" });
    mockRNShare(mockOpen);
    mockHtmlToPdf(mockConvert);

    shareNative = require("../share-service.native");
    const result = await shareNative.shareReport("<html></html>", "test.pdf");
    expect(result.kind).toBe("cancelled");
  });

  it("should return an actionable error when PDF generation fails", async () => {
    const mockOpen = jest.fn();
    const mockConvert = jest.fn().mockRejectedValue(new Error("disk full"));
    mockRNShare(mockOpen);
    mockHtmlToPdf(mockConvert);

    shareNative = require("../share-service.native");
    const result = await shareNative.shareReport("<html></html>", "test.pdf");

    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message).toContain("partager");
      expect(result.message).toContain("disk full");
    }
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("should return an actionable error when the share sheet throws", async () => {
    const mockOpen = jest.fn().mockRejectedValue(new Error("Share failed"));
    const mockConvert = jest
      .fn()
      .mockResolvedValue({ filePath: "/cache/report.pdf" });
    mockRNShare(mockOpen);
    mockHtmlToPdf(mockConvert);

    shareNative = require("../share-service.native");
    const result = await shareNative.shareReport("<html></html>", "test.pdf");

    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message).toContain("Share failed");
    }
  });

  it("should return an error when the PDF library reports no filePath", async () => {
    const mockOpen = jest.fn();
    const mockConvert = jest.fn().mockResolvedValue({ filePath: undefined });
    mockRNShare(mockOpen);
    mockHtmlToPdf(mockConvert);

    shareNative = require("../share-service.native");
    const result = await shareNative.shareReport("<html></html>", "test.pdf");

    expect(result.kind).toBe("error");
    expect(mockOpen).not.toHaveBeenCalled();
  });
});

describe("downloadReport (native)", () => {
  let shareNative: typeof import("../share-service.native");

  beforeEach(() => {
    jest.resetModules();
  });

  it("should generate the PDF and return its file path without opening a share sheet", async () => {
    const mockOpen = jest.fn();
    const mockConvert = jest
      .fn()
      .mockResolvedValue({ filePath: "/storage/docs/Report.pdf" });
    mockRNShare(mockOpen);
    mockHtmlToPdf(mockConvert);

    shareNative = require("../share-service.native");
    const result = await shareNative.downloadReport("<html></html>", "Report.pdf");

    expect(mockOpen).not.toHaveBeenCalled();
    expect(result.kind).toBe("downloaded");
    if (result.kind === "downloaded") {
      expect(result.filePath).toBe("/storage/docs/Report.pdf");
    }
  });

  it("should return an actionable error when generation fails", async () => {
    const mockConvert = jest.fn().mockRejectedValue(new Error("permission denied"));
    mockRNShare(jest.fn());
    mockHtmlToPdf(mockConvert);

    shareNative = require("../share-service.native");
    const result = await shareNative.downloadReport("<html></html>", "Report.pdf");

    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message).toContain("enregistrer");
      expect(result.message).toContain("permission denied");
    }
  });
});

describe("ShareResult / DownloadResult types", () => {
  it("should export ShareResult type with correct variants", () => {
    const shared = { kind: "shared" as const };
    const cancelled = { kind: "cancelled" as const };
    const error = { kind: "error" as const, message: "test" };

    expect(shared.kind).toBe("shared");
    expect(cancelled.kind).toBe("cancelled");
    expect(error.kind).toBe("error");
    expect(error.message).toBe("test");
  });
});
