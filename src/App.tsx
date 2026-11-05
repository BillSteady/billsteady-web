import { useState } from "react";
import { usePlannerState } from "./lib/store";
import { PlannerScreen } from "./screens/PlannerScreen";
import { BillsScreen } from "./screens/BillsScreen";
import { AskForTimeScreen } from "./screens/AskForTimeScreen";
import { AskIcon, BillsIcon, JarMark, PlannerIcon } from "./components/icons";

type Tab = "planner" | "bills" | "ask";

const TABS: { id: Tab; label: string; Icon: typeof PlannerIcon }[] = [
  { id: "planner", label: "Planner", Icon: PlannerIcon },
  { id: "bills", label: "Bills", Icon: BillsIcon },
  { id: "ask", label: "Ask for time", Icon: AskIcon },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("planner");
  const [state, setState] = usePlannerState();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-white/95 p-4 backdrop-blur">
        <JarMark />
        <div>
          <h1 className="text-lg font-bold leading-tight text-brand-700">BillSteady</h1>
          <p className="text-xs text-gray-500">Plan ahead. Save daily. Pay on time.</p>
        </div>
      </header>

      <main className="flex-1 pb-2">
        {tab === "planner" && <PlannerScreen state={state} onNavigate={setTab} />}
        {tab === "bills" && <BillsScreen state={state} setState={setState} />}
        {tab === "ask" && <AskForTimeScreen state={state} onNavigate={setTab} />}
      </main>

      <nav className="sticky bottom-0 flex border-t border-gray-100 bg-white/95 p-1.5 backdrop-blur">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-medium transition-colors active:scale-95 ${
                active ? "bg-brand-50 text-brand-700" : "text-gray-500"
              }`}
              aria-current={active}
            >
              <Icon className={`h-5 w-5 ${active ? "text-brand-600" : "text-gray-400"}`} />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
