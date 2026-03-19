import { renderHook } from "@testing-library/react-native";
import { useResponsiveStyle } from "../use-responsive-style";

// Mock usePlatform
let mockIsTablet = false;

jest.mock("../use-platform", () => ({
  usePlatform: () => ({
    isWeb: false,
    isIOS: true,
    isAndroid: false,
    isNative: true,
    isTablet: mockIsTablet,
    screenWidth: mockIsTablet ? 1024 : 375,
    screenHeight: mockIsTablet ? 1366 : 812,
  }),
}));

describe("useResponsiveStyle", () => {
  const compact = { padding: 16 };
  const expanded = { padding: 32 };

  beforeEach(() => {
    mockIsTablet = false;
  });

  it("returns compact style on phone (isTablet=false)", () => {
    mockIsTablet = false;
    const { result } = renderHook(() => useResponsiveStyle(compact, expanded));
    expect(result.current).toBe(compact);
  });

  it("returns expanded style on tablet (isTablet=true)", () => {
    mockIsTablet = true;
    const { result } = renderHook(() => useResponsiveStyle(compact, expanded));
    expect(result.current).toBe(expanded);
  });

  it("works with array styles on phone", () => {
    mockIsTablet = false;
    const compactArr = [{ padding: 8 }, { margin: 4 }] as const;
    const expandedArr = [{ padding: 24 }, { margin: 16 }] as const;
    const { result } = renderHook(() =>
      useResponsiveStyle(compactArr, expandedArr),
    );
    expect(result.current).toBe(compactArr);
  });

  it("works with array styles on tablet", () => {
    mockIsTablet = true;
    const compactArr = [{ padding: 8 }, { margin: 4 }] as const;
    const expandedArr = [{ padding: 24 }, { margin: 16 }] as const;
    const { result } = renderHook(() =>
      useResponsiveStyle(compactArr, expandedArr),
    );
    expect(result.current).toBe(expandedArr);
  });
});
