import { describe, expect, it } from "vitest";
import { billOccurrences, buildPlan, dailySetAside, nextOn, paydays, type Bill } from "./planner";

describe("nextOn", () => {
  it("weekly: returns the given date itself when it already matches", () => {
    // 2026-11-02 is a Monday
    expect(nextOn({ type: "weekly", weekday: 1 }, "2026-11-02")).toBe("2026-11-02");
  });

  it("weekly: returns the next matching weekday", () => {
    // 2026-11-04 is a Wednesday; next Friday (5) is 2026-11-06
    expect(nextOn({ type: "weekly", weekday: 5 }, "2026-11-04")).toBe("2026-11-06");
  });

  it("monthly: clamps the 31st to February in a non-leap year", () => {
    expect(nextOn({ type: "monthly", dayOfMonth: 31 }, "2027-02-01")).toBe("2027-02-28");
  });

  it("monthly: clamps the 31st to February in a leap year", () => {
    expect(nextOn({ type: "monthly", dayOfMonth: 31 }, "2028-02-01")).toBe("2028-02-29");
  });

  it("monthly: rolls to next month when the day has already passed", () => {
    expect(nextOn({ type: "monthly", dayOfMonth: 5 }, "2026-11-10")).toBe("2026-12-05");
  });

  it("biweekly: walks forward from an anchor in the past", () => {
    // Anchor 2026-10-01, from 2026-11-04 -> next 14-day step on/after that date
    const next = nextOn({ type: "biweekly", weekday: 4, anchor: "2026-10-01" }, "2026-11-04");
    expect(next >= "2026-11-04").toBe(true);
    // Must land exactly on a 14-day multiple from the anchor
    const diffDays = (Date.parse(next) - Date.parse("2026-10-01")) / 86_400_000;
    expect(diffDays % 14).toBe(0);
  });
});

describe("paydays", () => {
  it("weekly: lists every occurrence inside the horizon", () => {
    const dates = paydays({ type: "weekly", weekday: 1 }, "2026-11-02", 21);
    expect(dates).toEqual(["2026-11-02", "2026-11-09", "2026-11-16"]);
  });

  it("monthly: lists one occurrence per month across a 35-day horizon", () => {
    const dates = paydays({ type: "monthly", dayOfMonth: 28 }, "2026-11-01", 35);
    expect(dates).toEqual(["2026-11-28"]);
  });
});

describe("billOccurrences", () => {
  it("monthly bill due on the 31st clamps correctly in February", () => {
    const bill: Bill = {
      id: "rent",
      name: "Rent",
      amountKobo: 10_000_00,
      dueDay: 31,
      recurrence: "monthly",
    };
    const occs = billOccurrences(bill, "2027-02-01", 35);
    expect(occs).toEqual([{ date: "2027-02-28", amountKobo: 10_000_00 }]);
  });

  it("nets a partial payment off the first occurrence only", () => {
    const bill: Bill = {
      id: "electricity",
      name: "Electricity",
      amountKobo: 5_000_00,
      dueDay: 10,
      recurrence: "monthly",
      paidKobo: 2_000_00,
    };
    const occs = billOccurrences(bill, "2026-11-01", 65);
    expect(occs[0]).toEqual({ date: "2026-11-10", amountKobo: 3_000_00 });
    expect(occs[1]).toEqual({ date: "2026-12-10", amountKobo: 5_000_00 });
  });

  it("a fully-paid bill produces no occurrences", () => {
    const bill: Bill = {
      id: "data",
      name: "Data",
      amountKobo: 1_000_00,
      dueDay: 15,
      recurrence: "monthly",
      paidKobo: 1_000_00,
    };
    expect(billOccurrences(bill, "2026-11-01", 35)).toEqual([]);
  });

  it("a one-off bill outside the horizon is excluded", () => {
    const bill: Bill = {
      id: "fees",
      name: "School fees",
      amountKobo: 50_000_00,
      dueDay: 1,
      recurrence: "once",
      dueDate: "2027-06-01",
    };
    expect(billOccurrences(bill, "2026-11-01", 35)).toEqual([]);
  });
});

describe("buildPlan", () => {
  it("applies income before a bill due on the same day", () => {
    const result = buildPlan({
      today: "2026-11-04",
      horizonDays: 7,
      cashOnHandKobo: 0,
      incomeKobo: 10_000_00,
      paydayRule: { type: "weekly", weekday: 3 }, // Wednesday = 2026-11-04 itself
      bills: [
        {
          id: "airtime",
          name: "Airtime",
          amountKobo: 2_000_00,
          dueDay: 4,
          recurrence: "monthly",
        },
      ],
    });

    const billEvent = result.events.find((e) => e.type === "bill");
    expect(billEvent).toBeDefined();
    expect(billEvent!.runningBalanceKobo).toBe(8_000_00);
    expect((billEvent as { shortfallKobo: number }).shortfallKobo).toBe(0);
  });

  it("flags a shortfall when a bill exceeds the running balance", () => {
    // horizonDays: 20 keeps this to a single occurrence of the monthly bill
    // (a longer horizon would legitimately also catch next month's Dec 5 due date).
    const result = buildPlan({
      today: "2026-11-01",
      horizonDays: 20,
      cashOnHandKobo: 1_000_00,
      incomeKobo: 3_000_00,
      paydayRule: { type: "monthly", dayOfMonth: 28 },
      bills: [
        {
          id: "rent",
          name: "Rent",
          amountKobo: 20_000_00,
          dueDay: 5,
          recurrence: "monthly",
        },
      ],
    });

    expect(result.shortBills).toHaveLength(1);
    expect(result.shortBills[0]).toMatchObject({ billId: "rent", shortfallKobo: 19_000_00 });
  });

  it("weekly payday: produces an ending balance consistent with total income minus total bills", () => {
    const result = buildPlan({
      today: "2026-11-02",
      horizonDays: 28,
      cashOnHandKobo: 0,
      incomeKobo: 5_000_00,
      paydayRule: { type: "weekly", weekday: 1 },
      bills: [
        { id: "data", name: "Data", amountKobo: 2_000_00, dueDay: 15, recurrence: "monthly" },
      ],
    });
    // 4 weekly paydays in 28 days, one bill occurrence
    expect(result.endingBalanceKobo).toBe(4 * 5_000_00 - 2_000_00);
  });
});

describe("dailySetAside", () => {
  it("splits the remaining amount evenly across the days left", () => {
    const bill: Bill = {
      id: "rent",
      name: "Rent",
      amountKobo: 10_000_00,
      dueDay: 20,
      recurrence: "monthly",
      paidKobo: 0,
    };
    // 2026-11-10 -> next due 2026-11-20 = 10 days left
    expect(dailySetAside(bill, "2026-11-10")).toBe(10_000_00 / 10);
  });

  it("accounts for a partial payment already made", () => {
    const bill: Bill = {
      id: "rent",
      name: "Rent",
      amountKobo: 10_000_00,
      dueDay: 20,
      recurrence: "monthly",
      paidKobo: 4_000_00,
    };
    expect(dailySetAside(bill, "2026-11-10")).toBe(6_000_00 / 10);
  });

  it("returns 0 once the bill is fully paid", () => {
    const bill: Bill = {
      id: "data",
      name: "Data",
      amountKobo: 1_000_00,
      dueDay: 15,
      recurrence: "monthly",
      paidKobo: 1_000_00,
    };
    expect(dailySetAside(bill, "2026-11-01")).toBe(0);
  });

  it("asks for the full remaining amount when the due date is today", () => {
    const bill: Bill = {
      id: "airtime",
      name: "Airtime",
      amountKobo: 500_00,
      dueDay: 10,
      recurrence: "monthly",
    };
    expect(dailySetAside(bill, "2026-11-10")).toBe(500_00);
  });
});
