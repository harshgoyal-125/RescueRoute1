import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  title = 'No items found',
  description = 'There are no records matching your criteria at this time.',
  action,
  icon: Icon = PackageOpen
}) {
  return (
    <div className="state-container" data-testid="empty-state">
      <div className="state-icon state-icon-empty">
        <Icon size={24} />
      </div>
      <h4 className="state-title">{title}</h4>
      <p className="state-description">{description}</p>
      {action && <div className="state-action">{action}</div>}
    </div>
  );
}
