import { renderHook } from '@testing-library/react-native';
import { usePlatform } from '../use-platform';

describe('usePlatform', () => {
  it('returns platform flags', () => {
    const { result } = renderHook(() => usePlatform());
    expect(typeof result.current.isWeb).toBe('boolean');
    expect(typeof result.current.isIOS).toBe('boolean');
    expect(typeof result.current.isAndroid).toBe('boolean');
    expect(typeof result.current.isNative).toBe('boolean');
  });

  it('isNative is inverse of isWeb', () => {
    const { result } = renderHook(() => usePlatform());
    expect(result.current.isNative).toBe(!result.current.isWeb);
  });

  it('only one of isIOS/isAndroid/isWeb is true (in tests runs on ios mock)', () => {
    const { result } = renderHook(() => usePlatform());
    const trueFlags = [result.current.isIOS, result.current.isAndroid, result.current.isWeb]
      .filter(Boolean);
    expect(trueFlags.length).toBe(1);
  });
});
