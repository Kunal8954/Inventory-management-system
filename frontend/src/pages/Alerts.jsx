import { EmptyState, Button } from '../components/common';

export default function Alerts() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Low Stock Alerts</h1>

      <EmptyState
        title="No low stock alerts"
        description="Inventory levels are currently healthy. When an item falls below its reorder point it will appear here with recommended actions."
        action={
          <a href="/inventory">
            <Button variant="primary">Review Inventory</Button>
          </a>
        }
      />
    </div>
  );
}
