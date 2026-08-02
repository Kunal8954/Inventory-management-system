import { EmptyState, Button } from '../components/common';

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Settings</h1>

      <EmptyState
        title="No settings configured"
        description="Configure application settings such as notifications, user preferences, and integrations."
        action={
          <a href="/settings/profile">
            <Button variant="primary">Edit Profile</Button>
          </a>
        }
      />
    </div>
  );
}
