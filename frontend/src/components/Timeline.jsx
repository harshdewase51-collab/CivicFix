import React from 'react';
import { Check, Clock, Wrench, CheckCircle } from 'lucide-react';
import { formatDateTime } from '@civicfix/client';

export default function Timeline({ status, createdAt, updatedAt }) {
  const norm = (status || '').toUpperCase();

  // Status mapping:
  // PENDING -> Reported / Under Review
  // IN_PROGRESS -> In Progress
  // RESOLVED -> Resolved
  let currentLevel = 1;
  if (norm === 'PENDING') currentLevel = 2;
  if (norm === 'IN_PROGRESS') currentLevel = 3;
  if (norm === 'RESOLVED') currentLevel = 4;

  const steps = [
    {
      label: 'REPORTED',
      subtitle: createdAt ? formatDateTime(createdAt) : null,
      level: 1,
      icon: Check
    },
    {
      label: 'UNDER REVIEW',
      subtitle: norm === 'PENDING' ? 'Active review' : (currentLevel > 2 ? 'Approved' : 'Queued'),
      level: 2,
      icon: Clock
    },
    {
      label: 'IN PROGRESS',
      subtitle: norm === 'IN_PROGRESS' && updatedAt ? formatDateTime(updatedAt) : (currentLevel > 3 ? 'Completed' : 'Pending work'),
      level: 3,
      icon: Wrench
    },
    {
      label: 'RESOLVED',
      subtitle: norm === 'RESOLVED' && updatedAt ? formatDateTime(updatedAt) : 'Pending resolution',
      level: 4,
      icon: CheckCircle
    }
  ];

  return (
    <div className="timeline-track" role="region" aria-label="Report lifecycle progression">
      {steps.map((step) => {
        const isCompleted = step.level < currentLevel || (norm === 'RESOLVED' && step.level === 4);
        const isActive = step.level === currentLevel && norm !== 'RESOLVED';
        const StepIcon = step.icon;

        let statusClass = '';
        if (isCompleted) statusClass = 'completed';
        else if (isActive) statusClass = 'active';

        return (
          <div key={step.level} className={`timeline-step ${statusClass}`}>
            <div className="timeline-circle" aria-hidden="true">
              <StepIcon size={16} />
            </div>
            <div className="timeline-label">{step.label}</div>
            {step.subtitle && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '0.2rem', lineHeight: 1.2 }}>
                {step.subtitle}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

