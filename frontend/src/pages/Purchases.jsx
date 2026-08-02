import { EmptyState, Button } from '../components/common';

export default function Purchases() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Purchases</h1>

      <EmptyState
        title="No purchase records"
        description="Purchase orders and receipts will appear here once recorded."
        action={
          <a href="/purchases/new">
            <Button variant="primary">Create Purchase</Button>
          </a>
        }
      />
    </div>
  );
}
