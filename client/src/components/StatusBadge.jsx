import React from 'react';
import { Clock, Wrench, CheckCircle2 } from 'lucide-react';

export default function StatusBadge({ status }) {
  const norm = (status || '').toUpperCase();

  switch (norm) {
    case 'PENDING':
      return (
        <span className="status-badge pending">
          <Clock size={13} /> Pending
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="status-badge in_progress">
          <Wrench size={13} /> In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="status-badge resolved">
          <CheckCircle2 size={13} /> Resolved
        </span>
      );
    default:
      return <span className="status-badge">{status}</span>;
  }
}
