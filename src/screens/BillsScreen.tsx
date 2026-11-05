import { useState } from "react";
import type { Bill, PaydayRule } from "../lib/planner";
import { todayIso } from "../lib/date";
import type { PlannerState } from "../lib/store";
import { formatKobo, koboToInputValue, nairaInputToKobo } from "../lib/format";
import { PencilIcon } from "../components/icons";

const TODAY = todayIso();

interface BillDraft {
  name: string;
  amount: string; // naira, as typed
  recurrence: "monthly" | "once";
  dueDay: string;
  dueDate: string;
  paidSoFar: string; // naira, as typed
}

function draftFromBill(bill?: Bill): BillDraft {
  return {
    name: bill?.name ?? "",
    amount: bill ? koboToInputValue(bill.amountKobo) : "",
    recurrence: bill?.recurrence ?? "monthly",
    dueDay: bill && bill.recurrence === "monthly" ? String(bill.dueDay) : "1",
    dueDate: bill && bill.recurrence === "once" ? (bill.dueDate ?? TODAY) : TODAY,
    paidSoFar: bill ? koboToInputValue(bill.paidKobo) : "",
  };
}

function draftToBill(draft: BillDraft, id: string): Bill | null {
  const amountKobo = nairaInputToKobo(draft.amount);
  if (!draft.name.trim() || amountKobo <= 0) return null;

  const paidKobo = nairaInputToKobo(draft.paidSoFar);
  const base = {
    id,
    name: draft.name.trim(),
    amountKobo,
    ...(paidKobo > 0 ? { paidKobo } : {}),
  };

  if (draft.recurrence === "once") {
    if (!draft.dueDate) return null;
    return { ...base, recurrence: "once", dueDate: draft.dueDate, dueDay: 1 };
  }
  const dueDay = Math.min(31, Math.max(1, Number(draft.dueDay) || 1));
  return { ...base, recurrence: "monthly", dueDay };
}

function RecurrenceToggle({
  value,
  onChange,
}: {
  value: "monthly" | "once";
  onChange: (v: "monthly" | "once") => void;
}) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
      {(["monthly", "once"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 rounded-md py-1.5 transition-colors ${
            value === v ? "bg-white text-brand-700 shadow-sm" : "text-gray-500"
          }`}
        >
          {v === "monthly" ? "Monthly" : "One-off"}
        </button>
      ))}
    </div>
  );
}

function BillFormFields({
  draft,
  setDraft,
}: {
  draft: BillDraft;
  setDraft: React.Dispatch<React.SetStateAction<BillDraft>>;
}) {
  return (
    <div className="space-y-3">
      <input
        className="w-full rounded-lg border border-gray-200 p-2.5"
        placeholder="e.g. Rent"
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
      />
      <input
        type="number"
        min={0}
        className="w-full rounded-lg border border-gray-200 p-2.5"
        placeholder="Amount (₦)"
        value={draft.amount}
        onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
      />
      <RecurrenceToggle
        value={draft.recurrence}
        onChange={(recurrence) => setDraft((d) => ({ ...d, recurrence }))}
      />
      {draft.recurrence === "monthly" ? (
        <label className="block text-sm text-gray-600">
          Due day of month
          <input
            type="number"
            min={1}
            max={31}
            className="mt-1 w-full rounded-lg border border-gray-200 p-2.5"
            value={draft.dueDay}
            onChange={(e) => setDraft((d) => ({ ...d, dueDay: e.target.value }))}
          />
        </label>
      ) : (
        <label className="block text-sm text-gray-600">
          Due date
          <input
            type="date"
            min={TODAY}
            className="mt-1 w-full rounded-lg border border-gray-200 p-2.5"
            value={draft.dueDate}
            onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
          />
        </label>
      )}
      <label className="block text-sm text-gray-600">
        Already saved toward this (₦)
        <input
          type="number"
          min={0}
          className="mt-1 w-full rounded-lg border border-gray-200 p-2.5"
          placeholder="0"
          value={draft.paidSoFar}
          onChange={(e) => setDraft((d) => ({ ...d, paidSoFar: e.target.value }))}
        />
      </label>
    </div>
  );
}

export function BillsScreen({
  state,
  setState,
}: {
  state: PlannerState;
  setState: React.Dispatch<React.SetStateAction<PlannerState>>;
}) {
  const [draft, setDraft] = useState<BillDraft>(draftFromBill());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<BillDraft | null>(null);

  function addBill(e: React.FormEvent) {
    e.preventDefault();
    const bill = draftToBill(draft, crypto.randomUUID());
    if (!bill) return;
    setState((s) => ({ ...s, bills: [...s.bills, bill] }));
    setDraft(draftFromBill());
  }

  function removeBill(id: string) {
    setState((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) }));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(bill: Bill) {
    setEditingId(bill.id);
    setEditDraft(draftFromBill(bill));
  }

  function updateEditDraft(update: React.SetStateAction<BillDraft>) {
    setEditDraft((d) => (d ? (typeof update === "function" ? update(d) : update) : d));
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editDraft) return;
    const updated = draftToBill(editDraft, editingId);
    if (!updated) return;
    setState((s) => ({
      ...s,
      bills: s.bills.map((b) => (b.id === editingId ? updated : b)),
    }));
    setEditingId(null);
    setEditDraft(null);
  }

  function updatePaydayRule(rule: PaydayRule) {
    setState((s) => ({ ...s, paydayRule: rule }));
  }

  return (
    <div className="space-y-4 p-4">
      <div className="card space-y-3">
        <p className="font-semibold text-gray-900">Income</p>
        <label className="block text-sm text-gray-600">
          Cash on hand today (₦)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-200 p-2.5"
            value={state.cashOnHandKobo / 100 || ""}
            onChange={(e) =>
              setState((s) => ({ ...s, cashOnHandKobo: nairaInputToKobo(e.target.value) }))
            }
          />
        </label>
        <label className="block text-sm text-gray-600">
          Income per payday (₦)
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-200 p-2.5"
            value={state.incomeKobo / 100 || ""}
            onChange={(e) =>
              setState((s) => ({ ...s, incomeKobo: nairaInputToKobo(e.target.value) }))
            }
          />
        </label>
        <label className="block text-sm text-gray-600">
          Payday
          <select
            className="mt-1 w-full rounded-lg border border-gray-200 p-2.5"
            value={state.paydayRule.type}
            onChange={(e) => {
              const type = e.target.value as PaydayRule["type"];
              if (type === "monthly") updatePaydayRule({ type: "monthly", dayOfMonth: 28 });
              if (type === "weekly") updatePaydayRule({ type: "weekly", weekday: 5 });
              if (type === "biweekly")
                updatePaydayRule({ type: "biweekly", weekday: 5, anchor: TODAY });
            }}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every two weeks</option>
          </select>
        </label>
        {state.paydayRule.type === "monthly" && (
          <label className="block text-sm text-gray-600">
            Day of month
            <input
              type="number"
              min={1}
              max={31}
              className="mt-1 w-full rounded-lg border border-gray-200 p-2.5"
              value={state.paydayRule.dayOfMonth}
              onChange={(e) =>
                updatePaydayRule({ type: "monthly", dayOfMonth: Number(e.target.value) || 1 })
              }
            />
          </label>
        )}
      </div>

      <form onSubmit={addBill} className="card space-y-3">
        <p className="font-semibold text-gray-900">Add a bill</p>
        <BillFormFields draft={draft} setDraft={setDraft} />
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-600 p-2.5 font-medium text-white transition-transform active:scale-95"
        >
          Add bill
        </button>
      </form>

      <div className="card divide-y divide-gray-100 p-0">
        {state.bills.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-400">No bills yet.</p>
        )}
        {state.bills.map((bill) =>
          editingId === bill.id && editDraft ? (
            <form key={bill.id} onSubmit={saveEdit} className="space-y-3 p-4">
              <BillFormFields draft={editDraft} setDraft={updateEditDraft} />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-brand-600 p-2.5 text-sm font-medium text-white transition-transform active:scale-95"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="flex-1 rounded-lg border border-gray-200 p-2.5 text-sm font-medium text-gray-600 transition-transform active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div key={bill.id} className="flex items-center justify-between gap-2 p-3.5">
              <div>
                <p className="font-medium text-gray-900">{bill.name}</p>
                <p className="text-sm tabular-nums text-gray-500">
                  {formatKobo(bill.amountKobo)} ·{" "}
                  {bill.recurrence === "monthly"
                    ? `due ${bill.dueDay}${ordinalSuffix(bill.dueDay)}`
                    : `due ${bill.dueDate}`}
                  {!!bill.paidKobo && (
                    <span className="text-brand-600"> · {formatKobo(bill.paidKobo)} saved</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => startEdit(bill)}
                  className="flex items-center gap-1 text-sm font-medium text-gray-500"
                  aria-label={`Edit ${bill.name}`}
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => removeBill(bill.id)}
                  className="text-sm font-medium text-red-600"
                  aria-label={`Remove ${bill.name}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ),
        )}
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
