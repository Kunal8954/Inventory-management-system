import { EmptyState, Button } from '../components/common';

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Reports</h1>

      <EmptyState
        title="No reports available"
        description="Generate sales, inventory, and purchase reports here. Select report parameters to get started."
        action={
          <a href="/reports">
            <Button variant="primary">Generate Report</Button>
          </a>
        }
      />
    </div>
  );
}
