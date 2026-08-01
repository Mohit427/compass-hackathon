import { useEffect, useState } from 'react';

// Demo-only mock feed -- not real backend data. Cycles to give a "live
// monitoring" feel above the result card.
const MOCK_TRANSACTIONS = [
  { date: '2026-07-31', amount: 4200, direction: 'in', label: 'UPI Payment Received' },
  { date: '2026-07-30', amount: 1800, direction: 'out', label: 'Supplier Payment' },
  { date: '2026-07-30', amount: 950, direction: 'in', label: 'UPI Payment Received' },
  { date: '2026-07-29', amount: 3200, direction: 'out', label: 'Utility Bill' },
  { date: '2026-07-28', amount: 6100, direction: 'in', label: 'Bulk Order Payment' },
  { date: '2026-07-27', amount: 2400, direction: 'in', label: 'UPI Payment Received' },
  { date: '2026-07-26', amount: 1200, direction: 'out', label: 'Inventory Restock' },
  { date: '2026-07-25', amount: 780, direction: 'out', label: 'Utility Bill' },
];

const CYCLE_MS = 2200;

function TransactionTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % MOCK_TRANSACTIONS.length);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  const tx = MOCK_TRANSACTIONS[index];
  const isIn = tx.direction === 'in';

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-2.5 shadow-sm">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">
        Live Feed
      </span>
      <span key={index} className="flex-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 animate-fadein min-w-0">
        <span className="text-gray-400 dark:text-gray-500 font-mono text-xs shrink-0">{tx.date}</span>
        <span className="truncate">{tx.label}</span>
        <span className={`ml-auto font-mono font-semibold shrink-0 ${isIn ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {isIn ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
        </span>
      </span>
    </div>
  );
}

export default TransactionTicker;
