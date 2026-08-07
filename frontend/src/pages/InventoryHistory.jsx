import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, Badge } from '../components/common';
import { fetchTransactions } from '../services/inventoryService';

export default function InventoryHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchTransactions();
        if (!mounted) return;
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load inventory history');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Inventory History</p>
          <h1 className="text-3xl font-bold text-slate-900">Inventory History</h1>
        </div>
        <Skeleton count={4} height="h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Inventory History</p>
          <h1 className="text-3xl font-bold text-slate-900">Inventory History</h1>
        </div>
        <EmptyState title="Failed to load inventory history" description={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Dashboard &gt; Inventory History</p>
        <h1 className="text-3xl font-bold text-slate-900">Inventory History</h1>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No inventory history"
          description="Inventory transactions will appear here once stock movements are recorded."
        />
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-900">Type</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-900">Product</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-900">Quantity</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-900">Date</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-900">Time</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-900">Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b last:border-b-0">
                    <td className="px-6 py-4">
                      <Badge
                        label={transaction.type || 'Transaction'}
                        variant={(transaction.type || '').toLowerCase().includes('out') ? 'warning' : 'info'}
                      />
                    </td>
                    <td className="px-6 py-4">{transaction.productName || '-'}</td>
                    <td className="px-6 py-4">{transaction.quantity ?? '-'}</td>
                    <td className="px-6 py-4">{transaction.date ? new Date(transaction.date).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">{transaction.time || '-'}</td>
                    <td className="px-6 py-4 text-slate-500">{transaction.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
