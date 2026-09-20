import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { MapPin, Calendar, ExternalLink } from 'lucide-react';
import { formatDate } from '@civicfix/client';

export default function ReportTable({ reports = [], linkPrefix = '/reports', showCitizen = false }) {
  if (!reports || reports.length === 0) return null;

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Report ID</th>
            <th>Category</th>
            <th>Location</th>
            {showCitizen && <th>Citizen</th>}
            <th>Submitted</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((item) => (
            <tr key={item.id}>
              <td>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {item.report_id}
                </span>
              </td>
              <td>
                <span style={{ fontWeight: 600 }}>{item.category}</span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <MapPin size={13} color="var(--primary)" />
                  <span>{item.location}</span>
                </div>
              </td>
              {showCitizen && (
                <td>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.citizen_name || 'Resident'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.citizen_email}</div>
                  </div>
                </td>
              )}
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Calendar size={13} />
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </td>
              <td>
                <StatusBadge status={item.status} />
              </td>
              <td style={{ textAlign: 'right' }}>
                <Link
                  to={`${linkPrefix}/${item.report_id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.3rem' }}
                >
                  View <ExternalLink size={13} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
