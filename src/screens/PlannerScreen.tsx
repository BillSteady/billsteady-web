import { buildPlan, dailySetAside } from "../lib/planner";
import { formatKobo } from "../lib/format";
import type { PlannerState } from "../lib/store";

const TODAY = new Date().toISOString().slice(0, 10);
const HORIZON_DAYS = 35;

export function PlannerScreen({ state }: { state: PlannerState }) {
  const hasSetup = state.incomeKobo > 0 && state.bills.length > 0;

  if (!hasSetup) {
    return (
      <div className="p-4 text-sm text-gray-600">
        <p>Add your income and at least one bill on the Bills tab to see your plan.</p>
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

  return (
    <div className="p-4 space-y-4">
      {plan.shortBills.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="font-semibold text-red-800">Bills at risk before payday</p>
          <ul className="mt-1 space-y-1 text-sm text-red-700">
            {plan.shortBills.map((b) => (
              <li key={`${b.billId}-${b.dueDate}`}>
                {b.label}: short {formatKobo(b.shortfallKobo)} on {b.dueDate}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <p className="text-sm text-gray-500">Next {HORIZON_DAYS} days, ending balance</p>
        <p className="text-2xl font-bold">{formatKobo(plan.endingBalanceKobo)}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white divide-y">
        {plan.events.map((e, i) => (
          <div key={i} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{e.type === "payday" ? "Payday" : e.label}</p>
              <p className="text-gray-500">{e.date}</p>
            </div>
            <div className="text-right">
              <p className={e.type === "payday" ? "text-green-700" : "text-gray-900"}>
                {e.type === "payday" ? "+" : "-"}
                {formatKobo(e.amountKobo)}
              </p>
              <p className="text-gray-500">bal {formatKobo(e.runningBalanceKobo)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <p className="font-semibold">Save a little, daily</p>
        <ul className="mt-1 space-y-1 text-sm">
          {state.bills.map((bill) => (
            <li key={bill.id} className="flex justify-between">
              <span>{bill.name}</span>
              <span>{formatKobo(dailySetAside(bill, TODAY))}/day</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
