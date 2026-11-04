import {
  addDays,
  addMonthsClamped,
  compareDates,
  type IsoDate,
  nextDayOfMonthOnOrAfter,
  weekday,
} from "./date";

export type PaydayRule =
  | { type: "weekly"; weekday: number } // 0 = Sunday .. 6 = Saturday
  | { type: "biweekly"; weekday: number; anchor: IsoDate } // anchor = a known payday
  | { type: "monthly"; dayOfMonth: number }; // 1-31, clamped to month length

export interface Bill {
  id: string;
  name: string;
  amountKobo: number;
  dueDay: number; // day of month, 1-31, clamped
  recurrence: "monthly" | "once";
  dueDate?: IsoDate; // required when recurrence === "once"
  paidKobo?: number; // partial payments already made toward the next occurrence
}

export interface PlannerInput {
  today: IsoDate;
  horizonDays: number; // PRD default: 35
  cashOnHandKobo: number;
  incomeKobo: number;
  paydayRule: PaydayRule;
  bills: Bill[];
}

export type PlannerEvent =
  | {
      type: "payday";
      date: IsoDate;
      amountKobo: number;
      runningBalanceKobo: number;
    }
  | {
      type: "bill";
      date: IsoDate;
      billId: string;
      label: string;
      amountKobo: number; // the amount due on this occurrence, net of partial payment
      runningBalanceKobo: number;
      shortfallKobo: number; // > 0 when the running balance goes negative because of this bill
    };

export interface PlannerResult {
  events: PlannerEvent[];
  endingBalanceKobo: number;
  shortBills: { billId: string; label: string; dueDate: IsoDate; shortfallKobo: number }[];
}

/** The next date on/after `from` that satisfies the payday rule. */
export function nextOn(rule: PaydayRule, from: IsoDate): IsoDate {
  switch (rule.type) {
    case "weekly": {
      const delta = (rule.weekday - weekday(from) + 7) % 7;
      return addDays(from, delta);
    }
    case "biweekly": {
      let candidate = rule.anchor;
      // Walk forward in 14-day steps from the anchor until on/after `from`.
      // Anchors are expected within a few years of `from`; this is bounded.
      if (compareDates(candidate, from) < 0) {
        const daysBehind = -compareDates(candidate, from);
        const periods = Math.ceil(daysBehind / 14);
        candidate = addDays(candidate, periods * 14);
      }
      return candidate;
    }
    case "monthly":
      return nextDayOfMonthOnOrAfter(from, rule.dayOfMonth);
  }
}

/** All payday dates in [from, from + horizonDays). */
export function paydays(rule: PaydayRule, from: IsoDate, horizonDays: number): IsoDate[] {
  const end = addDays(from, horizonDays);
  const dates: IsoDate[] = [];
  let cursor = nextOn(rule, from);
  while (compareDates(cursor, end) < 0) {
    dates.push(cursor);
    switch (rule.type) {
      case "weekly":
        cursor = addDays(cursor, 7);
        break;
      case "biweekly":
        cursor = addDays(cursor, 14);
        break;
      case "monthly":
        cursor = nextDayOfMonthOnOrAfter(addDays(cursor, 1), rule.dayOfMonth);
        break;
    }
  }
  return dates;
}

/** Occurrences of a single bill in [from, from + horizonDays), net of any partial payment. */
export function billOccurrences(
  bill: Bill,
  from: IsoDate,
  horizonDays: number,
): { date: IsoDate; amountKobo: number }[] {
  const end = addDays(from, horizonDays);
  const remaining = Math.max(0, bill.amountKobo - (bill.paidKobo ?? 0));
  if (remaining <= 0) return [];

  if (bill.recurrence === "once") {
    if (!bill.dueDate) {
      throw new Error(`Bill ${bill.id} is "once" but has no dueDate`);
    }
    if (compareDates(bill.dueDate, from) >= 0 && compareDates(bill.dueDate, end) < 0) {
      return [{ date: bill.dueDate, amountKobo: remaining }];
    }
    return [];
  }

  // Monthly recurring: first occurrence is net of any partial payment; later
  // occurrences in the same horizon are the full amount.
  const occurrences: { date: IsoDate; amountKobo: number }[] = [];
  let due = nextDayOfMonthOnOrAfter(from, bill.dueDay);
  let first = true;
  while (compareDates(due, end) < 0) {
    occurrences.push({ date: due, amountKobo: first ? remaining : bill.amountKobo });
    first = false;
    due = addMonthsClamped(due, 1);
  }
  return occurrences;
}

/**
 * Builds the running-balance projection: paydays and bill due dates in order,
 * income applied before bills on the same date, flagging any bill that would
 * take the balance negative.
 */
export function buildPlan(input: PlannerInput): PlannerResult {
  const { today, horizonDays, cashOnHandKobo, incomeKobo, paydayRule, bills } = input;

  type RawEvent =
    | { type: "payday"; date: IsoDate; amountKobo: number }
    | { type: "bill"; date: IsoDate; billId: string; label: string; amountKobo: number };

  const raw: RawEvent[] = [];

  for (const date of paydays(paydayRule, today, horizonDays)) {
    raw.push({ type: "payday", date, amountKobo: incomeKobo });
  }
  for (const bill of bills) {
    for (const occ of billOccurrences(bill, today, horizonDays)) {
      raw.push({ type: "bill", date: occ.date, billId: bill.id, label: bill.name, amountKobo: occ.amountKobo });
    }
  }

  // Sort by date; on a tie, paydays are applied before bills.
  raw.sort((a, b) => {
    const byDate = compareDates(a.date, b.date);
    if (byDate !== 0) return byDate;
    if (a.type === b.type) return 0;
    return a.type === "payday" ? -1 : 1;
  });

  let balance = cashOnHandKobo;
  const events: PlannerEvent[] = [];
  const shortBills: PlannerResult["shortBills"] = [];

  for (const e of raw) {
    if (e.type === "payday") {
      balance += e.amountKobo;
      events.push({ type: "payday", date: e.date, amountKobo: e.amountKobo, runningBalanceKobo: balance });
    } else {
      balance -= e.amountKobo;
      const shortfallKobo = balance < 0 ? -balance : 0;
      events.push({
        type: "bill",
        date: e.date,
        billId: e.billId,
        label: e.label,
        amountKobo: e.amountKobo,
        runningBalanceKobo: balance,
        shortfallKobo,
      });
      if (shortfallKobo > 0) {
        shortBills.push({ billId: e.billId, label: e.label, dueDate: e.date, shortfallKobo });
      }
    }
  }

  return { events, endingBalanceKobo: balance, shortBills };
}

/**
 * Kobo/day the user needs to set aside, starting today, to cover the bill's
 * next occurrence by its due date. Returns 0 if nothing is owed or the due
 * date has already passed.
 */
export function dailySetAside(bill: Bill, today: IsoDate): number {
  const remaining = Math.max(0, bill.amountKobo - (bill.paidKobo ?? 0));
  if (remaining <= 0) return 0;

  const dueDate =
    bill.recurrence === "once" ? bill.dueDate! : nextDayOfMonthOnOrAfter(today, bill.dueDay);

  const daysLeft = compareDates(dueDate, today);
  if (daysLeft <= 0) return remaining; // due today (or overdue): the whole amount is needed now
  return Math.ceil(remaining / daysLeft);
}
