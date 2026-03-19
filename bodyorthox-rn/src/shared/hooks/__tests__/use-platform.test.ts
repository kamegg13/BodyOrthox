import { renderHook } from "@testing-library/react-native";

// Control the mock dimensions before importing the hook
let mockDimensions = { width: 375, height: 812, scale: 2, fontScale: 1 };

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => mockDimensions,
}));

// Import after mock is set up
import { usePlatform } from "../use-platform";

describe("usePlatform", () => {
  beforeEach(() => {
    mockDimensions = { width: 375, height: 812, scale: 2, fontScale: 1 };
  });

  it("returns platform flags with correct types", () => {
    const { result } = renderHook(() => usePlatform());
    expect(typeof result.current.isWeb).toBe("boolean");
    expect(typeof result.current.isIOS).toBe("boolean");
    expect(typeof result.current.isAndroid).toBe("boolean");
    expect(typeof result.current.isNative).toBe("boolean");
    expect(typeof result.current.isTablet).toBe("boolean");
    expect(typeof result.current.screenWidth).toBe("number");
    expect(typeof result.current.screenHeight).toBe("number");
  });

  it("isNative is inverse of isWeb", () => {
    const { result } = renderHook(() => usePlatform());
    expect(result.current.isNative).toBe(!result.current.isWeb);
  });

  it("isTablet is false when width < 768 (iPhone)", () => {
    mockDimensions = { width: 375, height: 812, scale: 3, fontScale: 1 };
    const { result } = renderHook(() => usePlatform());
    expect(result.current.isTablet).toBe(false);
  });

  it("isTablet is true when width === 768 (iPad boundary)", () => {
    mockDimensions = { width: 768, height: 1024, scale: 2, fontScale: 1 };
    const { result } = renderHook(() => usePlatform());
    expect(result.current.isTablet).toBe(true);
  });

  it("isTablet is true when width > 768 (iPad)", () => {
    mockDimensions = { width: 1024, height: 1366, scale: 2, fontScale: 1 };
    const { result } = renderHook(() => usePlatform());
    expect(result.current.isTablet).toBe(true);
  });

  it("isTablet is false at 767 (just below breakpoint)", () => {
    mockDimensions = { width: 767, height: 1024, scale: 2, fontScale: 1 };
    const { result } = renderHook(() => usePlatform());
    expect(result.current.isTablet).toBe(false);
  });

  it("returns screenWidth and screenHeight from useWindowDimensions", () => {
    mockDimensions = { width: 430, height: 932, scale: 3, fontScale: 1 };
    const { result } = renderHook(() => usePlatform());
    expect(result.current.screenWidth).toBe(430);
    expect(result.current.screenHeight).toBe(932);
  });

  it("isIOS is true on ios platform (test env default)", () => {
    const { result } = renderHook(() => usePlatform());
    expect(result.current.isIOS).toBe(true);
  });

  it("isWeb is false on ios platform (test env default)", () => {
    const { result } = renderHook(() => usePlatform());
    expect(result.current.isWeb).toBe(false);
  });
});
