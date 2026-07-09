import {
  validateImageFile,
  MAX_IMAGE_SIZE_BYTES,
} from "../validate-image-file";

describe("validateImageFile", () => {
  it("accepts a small JPEG image", () => {
    const result = validateImageFile({ type: "image/jpeg", size: 1024 });
    expect(result.ok).toBe(true);
  });

  it("accepts a PNG at the maximum allowed size", () => {
    const result = validateImageFile({
      type: "image/png",
      size: MAX_IMAGE_SIZE_BYTES,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a non-image MIME type with a clear message", () => {
    const result = validateImageFile({ type: "application/pdf", size: 1024 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/image/i);
    }
  });

  it("rejects an empty MIME type", () => {
    const result = validateImageFile({ type: "", size: 1024 });
    expect(result.ok).toBe(false);
  });

  it("rejects an image larger than the max size with a clear message", () => {
    const result = validateImageFile({
      type: "image/jpeg",
      size: MAX_IMAGE_SIZE_BYTES + 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/volumineuse/i);
    }
  });
});
