import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setKitLoaderForTests, useStellarWallet, type WalletKitLike } from "./wallet";

describe("useStellarWallet / getKit recovery", () => {
  afterEach(() => {
    setKitLoaderForTests();
  });

  it("clears the cached kitPromise after a failed wallet-kit load so the next connect() succeeds", async () => {
    const expectedAddress = "GA5VFTEXVQ424W3S4CWMLRRTSRBCDLJGRCLPXXKINZUTZSBCZFTWJ2P6";
    const fakeKit: WalletKitLike = {
      authModal: vi.fn().mockResolvedValue({ address: expectedAddress }),
      disconnect: vi.fn().mockResolvedValue(undefined),
      signTransaction: vi.fn().mockImplementation(async (xdr: string) => ({ signedTxXdr: xdr })),
    };

    const loader = vi
      .fn<() => Promise<WalletKitLike>>()
      .mockRejectedValueOnce(new Error("ChunkLoadError: failed to fetch wallet kit"))
      .mockResolvedValueOnce(fakeKit);

    setKitLoaderForTests(loader);

    const { result } = renderHook(() => useStellarWallet());

    // First attempt fails during dynamic import
    await act(async () => {
      await expect(result.current.connect()).rejects.toThrow("ChunkLoadError: failed to fetch wallet kit");
    });
    expect(result.current.error).toBe("ChunkLoadError: failed to fetch wallet kit");
    expect(result.current.address).toBeNull();
    expect(loader).toHaveBeenCalledTimes(1);

    // Second attempt invokes loader again (not stuck on cached rejection) and succeeds
    let connectedAddr = "";
    await act(async () => {
      connectedAddr = await result.current.connect();
    });
    expect(connectedAddr).toBe(expectedAddress);
    expect(result.current.address).toBe(expectedAddress);
    expect(result.current.error).toBeNull();
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
