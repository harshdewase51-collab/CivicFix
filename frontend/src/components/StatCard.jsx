import React from 'react';

export default function StatCard({ label, value, icon: Icon, variant = 'default' }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div>
        <div className="stat-val">{value !== undefined ? value : 0}</div>
        <div className="stat-lbl">{label}</div>
      </div>
      {Icon && (
        <div className="stat-icon">
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}
