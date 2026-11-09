import { useEffect, useState } from "react";

export interface SessionState {
  address: string | null;
  sep10Token: string | null;
}

const STORAGE_KEY = "billsteady.session.v1";

const defaultState: SessionState = {
  address: null,
  sep10Token: null,
};

function load(): SessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function save(state: SessionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private browsing, quota) - session stays in memory for this tab.
  }
}

/**
 * Persists only the connected wallet address and SEP-10 session token -
 * never a private key or seed (the wallet extension holds those, never
 * this app). Re-authenticating still requires a fresh wallet signature
 * once the JWT expires; this just avoids re-prompting "connect wallet" on
 * every page reload.
 */
export function useSessionState() {
  const [state, setState] = useState<SessionState>(load);

  useEffect(() => {
    save(state);
  }, [state]);

  return [state, setState] as const;
}
