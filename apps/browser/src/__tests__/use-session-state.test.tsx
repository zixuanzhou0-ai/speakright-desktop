import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearSessionPrefix,
  loadSession,
  SESSION_STORAGE_WARNING,
  saveSession,
  useSessionState,
} from "@/hooks/use-session-state";

describe("useSessionState persistence warnings", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("notifies when initial sessionStorage read fails", async () => {
    const onPersistenceError = vi.fn();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("", "SecurityError");
    });

    const { result } = renderHook(() =>
      useSessionState("session:blocked-read", "fallback", {
        onPersistenceError,
      }),
    );

    await waitFor(() =>
      expect(onPersistenceError).toHaveBeenCalledWith(SESSION_STORAGE_WARNING),
    );
    expect(result.current[0]).toBe("fallback");
  });

  it("notifies when a state update cannot be persisted", async () => {
    const onPersistenceError = vi.fn();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("", "QuotaExceededError");
    });

    const { result } = renderHook(() =>
      useSessionState("session:blocked-write", "first", {
        onPersistenceError,
      }),
    );

    await waitFor(() =>
      expect(onPersistenceError).toHaveBeenCalledWith(SESSION_STORAGE_WARNING),
    );

    act(() => {
      result.current[1]("second");
    });

    expect(result.current[0]).toBe("second");
    await waitFor(() =>
      expect(onPersistenceError).toHaveBeenCalledWith(SESSION_STORAGE_WARNING),
    );
  });

  it("notifies manual helpers when sessionStorage is unavailable", () => {
    const onPersistenceError = vi.fn();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("", "QuotaExceededError");
    });
    saveSession("session:manual", { ok: true }, { onPersistenceError });
    expect(onPersistenceError).toHaveBeenCalledWith(SESSION_STORAGE_WARNING);

    vi.restoreAllMocks();
    const onLoadError = vi.fn();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("", "SecurityError");
    });
    expect(
      loadSession("session:manual", { onPersistenceError: onLoadError }),
    ).toBeNull();
    expect(onLoadError).toHaveBeenCalledWith(SESSION_STORAGE_WARNING);

    vi.restoreAllMocks();
    const onClearError = vi.fn();
    vi.spyOn(Storage.prototype, "key").mockImplementation(() => {
      throw new DOMException("", "SecurityError");
    });
    sessionStorage.setItem("session:manual", "1");
    clearSessionPrefix("session:", { onPersistenceError: onClearError });
    expect(onClearError).toHaveBeenCalledWith(SESSION_STORAGE_WARNING);
  });
});
