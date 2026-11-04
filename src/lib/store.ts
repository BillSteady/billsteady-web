import { useEffect, useState } from "react";
import type { Bill, PaydayRule } from "./planner";

export interface PlannerState {
  cashOnHandKobo: number;
  incomeKobo: number;
  paydayRule: PaydayRule;
  bills: Bill[];
}

const STORAGE_KEY = "billsteady.planner.v1";

export const defaultState: PlannerState = {
  cashOnHandKobo: 0,
  incomeKobo: 0,
  paydayRule: { type: "monthly", dayOfMonth: 28 },
  bills: [],
};

function load(): PlannerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function save(state: PlannerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private browsing, quota) - state stays in memory for this session.
  }
}

/** Local-only planner state. Phase 0 has no backend; Prompt 0.5 (sync) replaces this with Supabase. */
export function usePlannerState() {
  const [state, setState] = useState<PlannerState>(load);

  useEffect(() => {
    save(state);
  }, [state]);

  return [state, setState] as const;
}
