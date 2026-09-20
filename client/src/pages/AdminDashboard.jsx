import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { 
  FileText, 
  Clock, 
  Wrench, 
  CheckCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  MapPin, 
  Calendar,
  User,
  ShieldCheck,
  ExternalLink
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
        api.get('/admin/stats'),
        api.get('/admin/reports')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (reportsRes.data.success) {
        setReports(reportsRes.data.reports || []);
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
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
      {/* Title & Admin Tag */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '0.4rem'
          }}>
            <ShieldCheck size={14} /> MUNICIPAL OPERATIONS CONSOLE
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Civic Grievances Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Review, prioritize, dispatch, and resolve community-submitted infrastructure tickets.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="btn btn-secondary btn-sm"
          disabled={loading}
          style={{ gap: '0.4rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stat-grid">
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

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
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
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            Civic Complaints ({filteredReports.length})
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing records sorted by latest
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              No complaints match the criteria
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Try clearing filters or search term.
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
                      <span style={{ fontWeight: 600 }}>{item.category}</span>
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
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
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
