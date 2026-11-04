import { useState } from "react";
import { usePlannerState } from "./lib/store";
import { PlannerScreen } from "./screens/PlannerScreen";
import { BillsScreen } from "./screens/BillsScreen";
import { AskForTimeScreen } from "./screens/AskForTimeScreen";

type Tab = "planner" | "bills" | "ask";

const TABS: { id: Tab; label: string }[] = [
  { id: "planner", label: "Planner" },
  { id: "bills", label: "Bills" },
  { id: "ask", label: "Ask for time" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("planner");
  const [state, setState] = usePlannerState();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="border-b border-gray-200 bg-white p-4">
        <h1 className="text-lg font-bold text-brand-700">BillSteady</h1>
        <p className="text-sm text-gray-500">Plan ahead. Save daily. Pay on time.</p>
      </header>

      <main className="flex-1">
        {tab === "planner" && <PlannerScreen state={state} />}
        {tab === "bills" && <BillsScreen state={state} setState={setState} />}
        {tab === "ask" && <AskForTimeScreen state={state} />}
      </main>

      <nav className="sticky bottom-0 flex border-t border-gray-200 bg-white">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 p-3 text-sm font-medium ${
              tab === t.id ? "text-brand-700" : "text-gray-500"
            }`}
            aria-current={tab === t.id}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
