import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService, formatDate } from '@civicfix/client';
import UserAvatar from '../components/UserAvatar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import CategoryIcon from '../components/CategoryIcon';
import { 
  FileText, 
  Clock, 
  Wrench, 
  CheckCircle, 
  RefreshCw, 
  MapPin, 
  Calendar,
  ShieldCheck,
  ExternalLink,
  Activity,
  AlertTriangle,
  BarChart3,
  Flame,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Pothole',
  'Streetlight',
  'Garbage',
  'Water Leakage',
  'Traffic Signal',
  'Public Infrastructure',
  'Other'
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, reportsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getAllReports()
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      if (reportsRes.success) {
        setReports(reportsRes.reports || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch administrative data. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : null;

  // Category distribution
  const categoryCounts = CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => ({
    name: cat,
    count: reports.filter((r) => r.category === cat).length
  })).filter((c) => c.count > 0);

  // Part 8: NEEDS ATTENTION (Deterministic pending & unresolved tickets)
  const pendingReports = reports.filter((r) => r.status === 'PENDING');
  // Sort by created_at ascending (oldest pending tickets)
  const needsAttentionList = [...pendingReports]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 4);

  // Filtered reports for the main table
  const filteredReports = reports.filter((item) => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesCat = categoryFilter === 'All Categories' || item.category === categoryFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      item.report_id.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      (item.citizen_name && item.citizen_name.toLowerCase().includes(term)) ||
      (item.citizen_email && item.citizen_email.toLowerCase().includes(term));

    return matchesStatus && matchesCat && matchesSearch;
  });

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Header: Civic Operations Center */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
          <UserAvatar user={user} size={54} style={{ border: '2.5px solid var(--primary)', flexShrink: 0 }} />
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              marginBottom: '0.35rem'
            }}>
              <ShieldCheck size={14} /> CIVIC OPERATIONS CENTER
            </div>
            <h1 style={{ fontSize: '1.95rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
              Civic Operations Center
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
              Monitor, prioritize, and manage reported community issues across all wards.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="btn btn-secondary btn-sm"
          disabled={loading}
          style={{ gap: '0.4rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Queue
        </button>
      </div>

      {/* Part 5: CIVIC PULSE (Stat Cards) */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <StatCard
          label="Total Reports"
          value={stats.total}
          icon={FileText}
          variant="default"
        />
        <StatCard
          label="Pending Triage"
          value={stats.pending}
          icon={Clock}
          variant="pending"
        />
        <StatCard
          label="In Progress"
          value={stats.in_progress}
          icon={Wrench}
          variant="progress"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          variant="resolved"
        />
      </div>

      {/* Grid Row: Civic Pulse Gauge & Common Issues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Civic Pulse Resolution Rate */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <Activity size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Civic Pulse & Resolution Rate
            </h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>City-wide Resolution Rate:</span>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, color: resolutionRate !== null ? 'var(--status-resolved-text)' : 'var(--text-muted)' }}>
              {resolutionRate !== null ? `${resolutionRate}%` : 'No reports yet'}
            </span>
          </div>

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
            <div style={{ padding: '0.75rem', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Open Backlog</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--status-pending-text)' }}>{stats.pending + stats.in_progress}</strong>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Verified Fixes</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--status-resolved-text)' }}>{stats.resolved}</strong>
            </div>
          </div>
        </div>

        {/* Part 6: COMMON ISSUES */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
            <BarChart3 size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Common Issues Distribution
            </h2>
          </div>

          {categoryCounts.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No categories reported yet.
            </div>
          ) : (
            <div className="issue-bar-container">
              {categoryCounts.map((cat) => {
                const percentage = stats.total > 0 ? Math.round((cat.count / stats.total) * 100) : 0;
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

      {/* Part 8: NEEDS ATTENTION */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <Flame size={18} color="var(--status-pending-text)" />
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Needs Attention — Pending Triage
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Oldest unreviewed complaints awaiting municipal review and dispatch
            </span>
          </div>
        </div>

        {needsAttentionList.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--status-resolved-text)', fontSize: '0.92rem', fontWeight: 600 }}>
            ✓ All caught up! No pending tickets currently awaiting triage.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {needsAttentionList.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                      {item.report_id}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      background: idx === 0 ? 'var(--danger-bg)' : 'var(--status-pending-bg)',
                      color: idx === 0 ? 'var(--danger-text)' : 'var(--status-pending-text)',
                      border: `1px solid ${idx === 0 ? 'var(--danger-border)' : 'var(--status-pending-border)'}`
                    }}>
                      {idx === 0 ? 'Pending Longest' : 'Awaiting Action'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                    <CategoryIcon category={item.category} size={15} color="var(--primary)" />
                    <span>{item.category}</span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    {item.location}
                  </p>
                </div>

                <Link
                  to={`/admin/reports/${item.report_id}`}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span>Review & Dispatch</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Part 14: ALL CIVIC REPORTS (Search & Filter Bar) */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Search Box */}
          <div>
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID, location, citizen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Quick Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'ALL' ? 'All' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            All Civic Reports ({filteredReports.length})
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Sorted by latest submission
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading administrative complaints queue...
          </div>
        ) : error ? (
          <div style={{ padding: '1.5rem' }}>
            <div className="alert alert-danger">{error}</div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-subtle)',
              marginBottom: '0.75rem'
            }}>
              <FileText size={26} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main)' }}>
              {reports.length === 0 ? 'No reports found.' : 'No matching reports found.'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {reports.length === 0 ? 'No civic issues have been submitted to the platform yet.' : 'Try adjusting your search criteria or clearing status filters.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Citizen Contact</th>
                  <th>Submitted Date</th>
                  <th>Current Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <MapPin size={13} color="var(--primary)" />
                        <span>{item.location}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {item.citizen_name || 'Anonymous'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {item.citizen_email}
                        </div>
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
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/admin/reports/${item.report_id}`}
                        className="btn btn-primary btn-sm"
                        style={{ gap: '0.3rem' }}
                      >
                        Manage <ExternalLink size={13} />
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
