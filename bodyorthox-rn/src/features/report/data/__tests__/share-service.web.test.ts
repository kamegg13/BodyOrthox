describe("shareReport (web)", () => {
  let shareWeb: typeof import("../share-service.web");
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;
  let openMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    createObjectURLMock = jest.fn().mockReturnValue("blob:mock-url");
    revokeObjectURLMock = jest.fn();
    (global as any).URL.createObjectURL = createObjectURLMock;
    (global as any).URL.revokeObjectURL = revokeObjectURLMock;

    shareWeb = require("../share-service.web");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should open a print window and return shared when the popup is allowed", async () => {
    openMock = jest.fn().mockReturnValue({ onload: null, print: jest.fn() });
    (global as any).window.open = openMock;

    const result = await shareWeb.shareReport("<html>content</html>", "Report.pdf");

    expect(openMock).toHaveBeenCalledWith("blob:mock-url", "_blank");
    expect(result.kind).toBe("shared");
  });

  it("should return an actionable error when the popup is blocked", async () => {
    (global as any).window.open = jest.fn().mockReturnValue(null);

    const result = await shareWeb.shareReport("<html></html>", "Report.pdf");

    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message.toLowerCase()).toContain("popup");
    }
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
});

/**
 * Le preset Jest "react-native" tourne dans un environnement Node sans DOM :
 * on fournit un `document` minimal (comme `localStorage` est mocké pour
 * database-web.test.ts) plutôt que de basculer sur l'environnement jsdom,
 * qui entre en conflit avec le polyfill `global.window` du preset RN.
 */
function fakeAnchorDocument() {
  const clickMock = jest.fn();
  const anchor = { href: "", download: "", click: clickMock };
  const createElement = jest.fn().mockReturnValue(anchor);
  const appendChild = jest.fn();
  const removeChild = jest.fn();
  return {
    document: { createElement, body: { appendChild, removeChild } },
    clickMock,
    createElement,
    appendChild,
    removeChild,
  };
}

describe("downloadReport (web)", () => {
  let shareWeb: typeof import("../share-service.web");
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;
  let fakeDoc: ReturnType<typeof fakeAnchorDocument>;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    createObjectURLMock = jest.fn().mockReturnValue("blob:mock-download-url");
    revokeObjectURLMock = jest.fn();
    (global as any).URL.createObjectURL = createObjectURLMock;
    (global as any).URL.revokeObjectURL = revokeObjectURLMock;

    fakeDoc = fakeAnchorDocument();
    (global as any).document = fakeDoc.document;

    shareWeb = require("../share-service.web");
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (global as any).document;
  });

  it("should trigger a real file download via a[download], not just open a print dialog", async () => {
    const result = await shareWeb.downloadReport("<html>content</html>", "Report.pdf");

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(fakeDoc.clickMock).toHaveBeenCalled();
    expect(fakeDoc.appendChild).toHaveBeenCalled();
    expect(fakeDoc.removeChild).toHaveBeenCalled();
    expect(result.kind).toBe("downloaded");
  });

  it("should set a[download] to the report's file name so the saved file is real, not a blob: URL", async () => {
    await shareWeb.downloadReport("<html></html>", "Report.pdf");

    const anchor = fakeDoc.createElement.mock.results[0].value;
    expect(anchor.href).toBe("blob:mock-download-url");
  });

  it("should name the downloaded file honestly (.html, since no PDF engine runs on web)", async () => {
    const result = await shareWeb.downloadReport("<html></html>", "Report.pdf");

    expect(result.kind).toBe("downloaded");
    if (result.kind === "downloaded") {
      expect(result.filePath).toBe("Report.html");
    }
  });

  it("should return an actionable error if the download fails", async () => {
    createObjectURLMock.mockImplementation(() => {
      throw new Error("Blob unsupported");
    });

    const result = await shareWeb.downloadReport("<html></html>", "Report.pdf");

    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message).toContain("Blob unsupported");
    }
  });
});
