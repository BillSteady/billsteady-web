import { buildPlan, dailySetAside } from "../lib/planner";
import { todayIso } from "../lib/date";
import { formatKobo } from "../lib/format";
import type { PlannerState } from "../lib/store";
import { EmptyJarIllustration, WarningIcon } from "../components/icons";

const TODAY = todayIso();
const HORIZON_DAYS = 35;

type Tab = "planner" | "bills" | "ask";

export function PlannerScreen({
  state,
  onNavigate,
}: {
  state: PlannerState;
  onNavigate: (tab: Tab) => void;
}) {
  const hasSetup = state.incomeKobo > 0 && state.bills.length > 0;

  if (!hasSetup) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
        <EmptyJarIllustration />
        <div>
          <h2 className="font-semibold text-gray-900">Your plan starts with one bill</h2>
          <p className="mt-1 text-sm text-gray-500">
            Add your income and a bill, and BillSteady will show you which bills are at risk
            before your next payday — and how much to save each day to stay ahead.
          </p>
        </div>
        <button
          onClick={() => onNavigate("bills")}
          className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-transform active:scale-95"
        >
          Add income and a bill
        </button>
      </div>
    );
  }

  const plan = buildPlan({
    today: TODAY,
    horizonDays: HORIZON_DAYS,
    cashOnHandKobo: state.cashOnHandKobo,
    incomeKobo: state.incomeKobo,
    paydayRule: state.paydayRule,
    bills: state.bills,
  });

  const isShort = plan.shortBills.length > 0;

  return (
    <div className="space-y-4 p-4">
      {isShort && (
        <div className="rounded-xl border-l-4 border-red-600 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-800">
            <WarningIcon className="h-5 w-5 shrink-0" />
            <p className="font-semibold">Bills at risk before payday</p>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-red-700">
            {plan.shortBills.map((b) => (
              <li key={`${b.billId}-${b.dueDate}`} className="flex justify-between gap-2">
                <span>{b.label}</span>
                <span className="tabular-nums font-medium">
                  short {formatKobo(b.shortfallKobo)} · {b.dueDate}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`card ${isShort ? "" : "border-brand-100 bg-brand-50/40"}`}>
        <p className="text-sm text-gray-500">Next {HORIZON_DAYS} days, ending balance</p>
        <p
          className={`mt-0.5 text-2xl font-bold tabular-nums ${
            plan.endingBalanceKobo < 0 ? "text-red-700" : "text-gray-900"
          }`}
        >
          {formatKobo(plan.endingBalanceKobo)}
        </p>
      </div>

      <div className="card divide-y divide-gray-100 p-0">
        {plan.events.map((e, i) => (
          <div key={i} className="flex items-center justify-between p-3.5 text-sm">
            <div>
              <p className="font-medium text-gray-900">{e.type === "payday" ? "Payday" : e.label}</p>
              <p className="text-gray-500">{e.date}</p>
            </div>
            <div className="text-right tabular-nums">
              <p className={e.type === "payday" ? "font-medium text-green-700" : "text-gray-900"}>
                {e.type === "payday" ? "+" : "-"}
                {formatKobo(e.amountKobo)}
              </p>
              <p className="text-gray-500">bal {formatKobo(e.runningBalanceKobo)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="font-semibold text-gray-900">Save a little, daily</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {state.bills.map((bill) => (
            <li key={bill.id} className="flex justify-between">
              <span className="text-gray-700">{bill.name}</span>
              <span className="tabular-nums font-medium text-gray-900">
                {formatKobo(dailySetAside(bill, TODAY))}/day
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
