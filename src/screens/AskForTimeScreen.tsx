import { useState } from "react";
import { buildPlan } from "../lib/planner";
import { todayIso } from "../lib/date";
import { extensionMessage } from "../lib/extensionMessage";
import type { PlannerState } from "../lib/store";
import { EmptyJarIllustration } from "../components/icons";

const TODAY = todayIso();

type Tab = "planner" | "bills" | "ask";

export function AskForTimeScreen({
  state,
  onNavigate,
}: {
  state: PlannerState;
  onNavigate: (tab: Tab) => void;
}) {
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
      <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
        <EmptyJarIllustration />
        <div>
          <h2 className="font-semibold text-gray-900">Nothing to ask for, yet</h2>
          <p className="mt-1 text-sm text-gray-500">
            No bills are short right now. If one ever is, this screen writes a polite
            part-payment message you can send straight away.
          </p>
        </div>
        <button
          onClick={() => onNavigate("planner")}
          className="rounded-full border border-brand-600 px-5 py-2.5 text-sm font-medium text-brand-700 transition-transform active:scale-95"
        >
          Back to Planner
        </button>
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
    <div className="space-y-4 p-4">
      <label className="block text-sm font-medium text-gray-700">
        Which bill?
        <select
          className="mt-1 w-full rounded-lg border border-gray-200 p-2.5"
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

      <div className="card">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{message}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={copyMessage}
          className="flex-1 rounded-lg bg-brand-600 p-2.5 font-medium text-white transition-transform active:scale-95"
        >
          {copied ? "Copied" : "Copy message"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-lg border border-brand-600 p-2.5 text-center font-medium text-brand-700 transition-transform active:scale-95"
        >
          Send on WhatsApp
        </a>
      </div>
    </div>
  );
}
