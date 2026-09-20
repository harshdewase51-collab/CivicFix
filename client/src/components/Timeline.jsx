import React from 'react';
import { Check, Clock, Wrench, CheckCircle } from 'lucide-react';

export default function Timeline({ status }) {
  const norm = (status || '').toUpperCase();

  // Steps definition
  // 1: Submitted
  // 2: Under Review (pending state)
  // 3: In Progress
  // 4: Resolved

  let currentLevel = 1;
  if (norm === 'PENDING') currentLevel = 2;
  if (norm === 'IN_PROGRESS') currentLevel = 3;
  if (norm === 'RESOLVED') currentLevel = 4;

  const steps = [
    { label: 'Submitted', level: 1, icon: Check },
    { label: 'Under Review', level: 2, icon: Clock },
    { label: 'In Progress', level: 3, icon: Wrench },
    { label: 'Resolved', level: 4, icon: CheckCircle }
  ];

  return (
    <div className="timeline-track">
      {steps.map((step) => {
        const isCompleted = step.level < currentLevel || (norm === 'RESOLVED' && step.level === 4);
        const isActive = step.level === currentLevel && norm !== 'RESOLVED';
        const StepIcon = step.icon;

        let statusClass = '';
        if (isCompleted) statusClass = 'completed';
        else if (isActive) statusClass = 'active';

        return (
          <div key={step.level} className={`timeline-step ${statusClass}`}>
            <div className="timeline-circle">
              <StepIcon size={16} />
            </div>
            <div className="timeline-label">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}
