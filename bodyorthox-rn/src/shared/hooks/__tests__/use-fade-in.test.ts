import { renderHook } from "@testing-library/react-native";
import { useFadeIn } from "../use-fade-in";

describe("useFadeIn", () => {
  it("returns an animatedStyle object", () => {
    const { result } = renderHook(() => useFadeIn());
    expect(result.current.animatedStyle).toBeDefined();
  });

  it("returns Animated module reference", () => {
    const { result } = renderHook(() => useFadeIn());
    expect(result.current.Animated).toBeDefined();
  });

  it("accepts delay option without errors", () => {
    const { result } = renderHook(() => useFadeIn({ delay: 100 }));
    expect(result.current.animatedStyle).toBeDefined();
  });

  it("accepts translateY option without errors", () => {
    const { result } = renderHook(() =>
      useFadeIn({ translateY: 20, duration: 400 }),
    );
    expect(result.current.animatedStyle).toBeDefined();
  });
});
