import { EmptyState, Button } from '../components/common';

export default function InventoryHistory() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Inventory History</h1>

      <EmptyState
        title="No inventory history"
        description="Inventory transactions will appear here once stock movements are recorded."
        action={
          <a href="/inventory">
            <Button variant="primary">View Inventory</Button>
          </a>
        }
      />
    </div>
  );
}
