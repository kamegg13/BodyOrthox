import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useAsyncData } from "../use-async-data";

describe("useAsyncData", () => {
  it("starts in loading state with null data", () => {
    const fetcher = () => new Promise<string>(() => {}); // never resolves
    const { result } = renderHook(() => useAsyncData(fetcher));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("resolves data and stops loading", async () => {
    const fetcher = jest.fn().mockResolvedValue("hello");
    const { result } = renderHook(() => useAsyncData(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe("hello");
    expect(result.current.error).toBeNull();
  });

  it("captures error message on rejection", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useAsyncData(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("boom");
  });

  it("captures non-Error rejections as generic message", async () => {
    const fetcher = jest.fn().mockRejectedValue("string error");
    const { result } = renderHook(() => useAsyncData(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Erreur inconnue");
  });

  it("refetch triggers a new fetch", async () => {
    let callCount = 0;
    const fetcher = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(`result-${callCount}`);
    });
    const { result } = renderHook(() => useAsyncData(fetcher));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe("result-1");

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.data).toBe("result-2"));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("re-fetches when deps change", async () => {
    let callCount = 0;
    const fetcher = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(`v${callCount}`);
    });

    const { result, rerender } = renderHook(
      ({ dep }: { dep: string }) => useAsyncData(fetcher, [dep]),
      { initialProps: { dep: "a" } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe("v1");

    rerender({ dep: "b" });

    await waitFor(() => expect(result.current.data).toBe("v2"));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("clears previous error on refetch success", async () => {
    const fetcher = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("ok");

    const { result } = renderHook(() => useAsyncData(fetcher));

    await waitFor(() => expect(result.current.error).toBe("fail"));

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.data).toBe("ok"));
    expect(result.current.error).toBeNull();
  });
});
