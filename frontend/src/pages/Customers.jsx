import { EmptyState, Button } from '../components/common';

export default function Customers() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Customers</h1>

      <EmptyState
        title="No customers yet"
        description="Add customers to track purchases, contact details, and sales history."
        action={
          <a href="/customers/new">
            <Button variant="primary">Add Customer</Button>
          </a>
        }
      />
    </div>
  );
}