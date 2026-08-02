import { EmptyState, Button } from '../components/common';

export default function Suppliers() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>

      <EmptyState
        title="No suppliers yet"
        description="Add suppliers to manage purchase orders, contact info, and lead times."
        action={
          <a href="/suppliers/new">
            <Button variant="primary">Add Supplier</Button>
          </a>
        }
      />
    </div>
  );
}
