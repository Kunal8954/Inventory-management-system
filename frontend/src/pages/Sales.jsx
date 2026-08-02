import { EmptyState, Button } from '../components/common';

export default function Sales() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Sales</h1>

      <EmptyState
        title="No sales yet"
        description="Sales orders and invoices will appear here once created."
        action={
          <a href="/sales/new">
            <Button variant="primary">Create Sale</Button>
          </a>
        }
      />
    </div>
  );
}
