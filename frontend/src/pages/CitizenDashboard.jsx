import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportService, formatDate } from '@civicfix/client';
import UserAvatar from '../components/UserAvatar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import CategoryIcon from '../components/CategoryIcon';
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  Wrench, 
  CheckCircle, 
  ArrowRight, 
  MapPin, 
  Calendar,
  Activity,
  BarChart3,
  Sparkles
} from 'lucide-react';

const CATEGORIES = [
  'Pothole',
  'Streetlight',
  'Garbage',
  'Water Leakage',
  'Traffic Signal',
  'Public Infrastructure',
  'Other'
];

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMyReports() {
      try {
        setLoading(true);
        const res = await reportService.getMyReports();
        if (res.success) {
          setReports(res.reports || []);
        }
      } catch (err) {
        setError('Failed to load your reports. Please refresh.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyReports();
  }, []);

  // Compute personal stats
  const totalReports = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;
  const inProgressCount = reports.filter((r) => r.status === 'IN_PROGRESS').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : null;

  // Category distribution
  const categoryCounts = CATEGORIES.map((cat) => ({
    name: cat,
    count: reports.filter((r) => r.category === cat).length
  })).filter((c) => c.count > 0);

  const recentReports = reports.slice(0, 5);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Welcome Banner & Action */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
          <UserAvatar user={user} size={54} style={{ border: '2.5px solid var(--primary)', flexShrink: 0 }} />
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              <Sparkles size={14} /> My Civic Space
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
              Welcome back, {user?.name || 'Citizen'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
              Track the civic issues you've reported in your community.
            </p>
          </div>
        </div>

        <Link to="/report" className="btn btn-primary btn-lg" style={{ gap: '0.5rem' }}>
          <PlusCircle size={18} /> Report a Problem
        </Link>
      </div>

      {/* Part 4: MY CIVIC ACTIVITY (Stat Cards) */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <StatCard
          label="My Reports"
          value={totalReports}
          icon={FileText}
          variant="default"
        />
        <StatCard
          label="Pending Triage"
          value={pendingCount}
          icon={Clock}
          variant="pending"
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={Wrench}
          variant="progress"
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          icon={CheckCircle}
          variant="resolved"
        />
      </div>

      {/* Part 5 & 6: CIVIC PULSE & COMMON ISSUES ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Civic Pulse Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <Activity size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Civic Pulse & Resolution
            </h2>
          </div>

          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Resolution Rate:</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: resolutionRate !== null ? 'var(--status-resolved-text)' : 'var(--text-muted)' }}>
                {resolutionRate !== null ? `${resolutionRate}%` : 'No reports yet'}
              </span>
            </div>

            {/* Resolution Progress Bar */}
            <div style={{ height: '10px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <div
                style={{
                  height: '100%',
                  width: `${resolutionRate || 0}%`,
                  background: 'var(--accent)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.6s ease'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ padding: '0.65rem', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Active Tickets</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{pendingCount + inProgressCount}</strong>
              </div>
              <div style={{ padding: '0.65rem', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Completed Fixes</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--status-resolved-text)' }}>{resolvedCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Common Issues Distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <BarChart3 size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Issues by Category
            </h2>
          </div>

          {categoryCounts.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No categories reported yet.
            </div>
          ) : (
            <div className="issue-bar-container">
              {categoryCounts.map((cat) => {
                const percentage = totalReports > 0 ? Math.round((cat.count / totalReports) * 100) : 0;
                return (
                  <div key={cat.name} className="issue-bar-row">
                    <div className="issue-bar-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CategoryIcon category={cat.name} size={15} color="var(--primary)" />
                        <span>{cat.name}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {cat.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="issue-bar-track">
                      <div className="issue-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Part 7: RECENT REPORTS TABLE */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Civic Activity</h2>
          {reports.length > 5 && (
            <Link to="/reports" className="btn btn-secondary btn-sm" style={{ gap: '0.3rem' }}>
              View All ({reports.length}) <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading your submitted reports...
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-subtle)',
              marginBottom: '1rem'
            }}>
              <FileText size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              No civic reports yet.
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              Report a local issue and track its progress here.
            </p>
            <Link to="/report" className="btn btn-primary">
              <PlusCircle size={16} /> Report a Problem
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {item.report_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                        <CategoryIcon category={item.category} size={15} color="var(--primary)" />
                        <span>{item.category}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                        <MapPin size={14} />
                        <span>{item.location}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <Calendar size={13} />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <Link to={`/reports/${item.report_id}`} className="btn btn-secondary btn-sm">
                        View Ticket
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
