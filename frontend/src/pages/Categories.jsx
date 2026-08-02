import { EmptyState, Button } from '../components/common';

export default function Categories() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Categories</h1>

      <EmptyState
        title="No categories yet"
        description="Organize products by categories to make filtering and reporting easier."
        action={
          <a href="/categories/new">
            <Button variant="primary">Add Category</Button>
          </a>
        }
      />
    </div>
  );
}
