import { useEffect, useState } from "react";
import { fetchPaymentHistory, type PaymentOrder } from "../lib/api";
import { formatKobo } from "../lib/format";

const STATUS_LABEL: Record<PaymentOrder["status"], string> = {
  quote: "Quoted",
  funded: "Confirmed on-chain",
  paying: "Paying biller",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export function HistoryScreen({ token }: { token: string }) {
  const [orders, setOrders] = useState<PaymentOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPaymentHistory(token)
      .then((o) => {
        if (!cancelled) setOrders(o);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load payment history");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return <div className="p-4 text-sm text-red-600">{error}</div>;
  }

  if (!orders) {
    return <div className="p-4 text-sm text-stone-400">Loading…</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center text-sm text-stone-500">
        <p>No payments yet. Pay a bill and it'll show up here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {orders.map((order) => (
        <div key={order.id} className="card flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-800">{order.billerName}</p>
            <p className="text-xs text-stone-500">{STATUS_LABEL[order.status]}</p>
          </div>
          <p className="text-sm font-bold tabular-nums text-stone-900">{formatKobo(order.amountKobo)}</p>
        </div>
      ))}
    </div>
  );
}
