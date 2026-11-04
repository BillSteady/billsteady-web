import { useState } from "react";
import type { Bill, PaydayRule } from "../lib/planner";
import type { PlannerState } from "../lib/store";
import { formatKobo } from "../lib/format";

function nairaToKobo(input: string): number {
  const n = Number(input.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

export function BillsScreen({
  state,
  setState,
}: {
  state: PlannerState;
  setState: React.Dispatch<React.SetStateAction<PlannerState>>;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");

  function addBill(e: React.FormEvent) {
    e.preventDefault();
    const amountKobo = nairaToKobo(amount);
    const day = Math.min(31, Math.max(1, Number(dueDay) || 1));
    if (!name.trim() || amountKobo <= 0) return;

    const bill: Bill = {
      id: crypto.randomUUID(),
      name: name.trim(),
      amountKobo,
      dueDay: day,
      recurrence: "monthly",
    };
    setState((s) => ({ ...s, bills: [...s.bills, bill] }));
    setName("");
    setAmount("");
    setDueDay("1");
  }

  function removeBill(id: string) {
    setState((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) }));
  }

  function updatePaydayRule(rule: PaydayRule) {
    setState((s) => ({ ...s, paydayRule: rule }));
  }

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
        <p className="font-semibold">Income</p>
        <label className="block text-sm">
          Cash on hand today (₦)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded border border-gray-300 p-2"
            value={state.cashOnHandKobo / 100 || ""}
            onChange={(e) =>
              setState((s) => ({ ...s, cashOnHandKobo: nairaToKobo(e.target.value) }))
            }
          />
        </label>
        <label className="block text-sm">
          Income per payday (₦)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded border border-gray-300 p-2"
            value={state.incomeKobo / 100 || ""}
            onChange={(e) => setState((s) => ({ ...s, incomeKobo: nairaToKobo(e.target.value) }))}
          />
        </label>
        <label className="block text-sm">
          Payday
          <select
            className="mt-1 w-full rounded border border-gray-300 p-2"
            value={state.paydayRule.type}
            onChange={(e) => {
              const type = e.target.value as PaydayRule["type"];
              if (type === "monthly") updatePaydayRule({ type: "monthly", dayOfMonth: 28 });
              if (type === "weekly") updatePaydayRule({ type: "weekly", weekday: 5 });
              if (type === "biweekly")
                updatePaydayRule({
                  type: "biweekly",
                  weekday: 5,
                  anchor: new Date().toISOString().slice(0, 10),
                });
            }}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every two weeks</option>
          </select>
        </label>
        {state.paydayRule.type === "monthly" && (
          <label className="block text-sm">
            Day of month
            <input
              type="number"
              min={1}
              max={31}
              className="mt-1 w-full rounded border border-gray-300 p-2"
              value={state.paydayRule.dayOfMonth}
              onChange={(e) =>
                updatePaydayRule({ type: "monthly", dayOfMonth: Number(e.target.value) || 1 })
              }
            />
          </label>
        )}
      </div>

      <form onSubmit={addBill} className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
        <p className="font-semibold">Add a bill</p>
        <input
          className="w-full rounded border border-gray-300 p-2"
          placeholder="e.g. Rent"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          min={0}
          className="w-full rounded border border-gray-300 p-2"
          placeholder="Amount (₦)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="number"
          min={1}
          max={31}
          className="w-full rounded border border-gray-300 p-2"
          placeholder="Due day of month"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
        />
        <button type="submit" className="w-full rounded bg-brand-600 p-2 font-medium text-white">
          Add bill
        </button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white divide-y">
        {state.bills.map((bill) => (
          <div key={bill.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{bill.name}</p>
              <p className="text-sm text-gray-500">
                {formatKobo(bill.amountKobo)} · due {bill.dueDay}
                {ordinalSuffix(bill.dueDay)}
              </p>
            </div>
            <button
              onClick={() => removeBill(bill.id)}
              className="text-sm text-red-600"
              aria-label={`Remove ${bill.name}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ordinalSuffix(day: number): string {
  if (day % 10 === 1 && day !== 11) return "st";
  if (day % 10 === 2 && day !== 12) return "nd";
  if (day % 10 === 3 && day !== 13) return "rd";
  return "th";
}
