import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { formatDate } from '@civicfix/client';

export default function ReportCard({ report, linkPrefix = '/reports' }) {
  if (!report) return null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '1.05rem' }}>
            {report.report_id}
          </span>
          <StatusBadge status={report.status} />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
          {report.category}
        </h3>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          marginBottom: '1rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {report.description}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={14} color="var(--primary)" />
            <span>{report.location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={14} />
            <span>Submitted: {formatDate(report.created_at)}</span>
          </div>
        </div>
      </div>

      <Link
        to={`${linkPrefix}/${report.report_id}`}
        className="btn btn-secondary btn-sm"
        style={{ width: '100%', justifyContent: 'space-between' }}
      >
        <span>View Details & Timeline</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
