import { EmptyState, Button } from '../components/common';

export default function Notifications() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>

      <EmptyState
        title="No notifications"
        description="You will see system and low-stock notifications here. Configure notification preferences in settings."
        action={
          <a href="/settings">
            <Button variant="primary">Notification Settings</Button>
          </a>
        }
      />
    </div>
  );
}
