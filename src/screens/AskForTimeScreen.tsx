import { useState } from "react";
import { buildPlan } from "../lib/planner";
import { extensionMessage } from "../lib/extensionMessage";
import type { PlannerState } from "../lib/store";

const TODAY = new Date().toISOString().slice(0, 10);

export function AskForTimeScreen({ state }: { state: PlannerState }) {
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const plan =
    state.bills.length > 0
      ? buildPlan({
          today: TODAY,
          horizonDays: 35,
          cashOnHandKobo: state.cashOnHandKobo,
          incomeKobo: state.incomeKobo,
          paydayRule: state.paydayRule,
          bills: state.bills,
        })
      : null;

  const shortBills = plan?.shortBills ?? [];
  const selected = shortBills.find((b) => b.billId === selectedBillId) ?? shortBills[0];

  if (shortBills.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-600">
        <p>No bills are short right now. This screen helps you ask for time when one is.</p>
      </div>
    );
  }

  const message = selected
    ? extensionMessage({ billName: selected.label, shortfallKobo: selected.shortfallKobo, dueDate: selected.dueDate })
    : "";

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable - the text is still shown for the user to select manually.
    }
  }

  return (
    <div className="p-4 space-y-4">
      <label className="block text-sm">
        Which bill?
        <select
          className="mt-1 w-full rounded border border-gray-300 p-2"
          value={selected?.billId}
          onChange={(e) => setSelectedBillId(e.target.value)}
        >
          {shortBills.map((b) => (
            <option key={b.billId} value={b.billId}>
              {b.label}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <p className="whitespace-pre-wrap text-sm">{message}</p>
      </div>

      <div className="flex gap-2">
        <button onClick={copyMessage} className="flex-1 rounded bg-brand-600 p-2 font-medium text-white">
          {copied ? "Copied" : "Copy message"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded border border-brand-600 p-2 text-center font-medium text-brand-700"
        >
          Send on WhatsApp
        </a>
      </div>
    </div>
  );
}
