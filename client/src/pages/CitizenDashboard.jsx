import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { PlusCircle, FileText, Clock, Wrench, CheckCircle, ArrowRight, MapPin, Calendar } from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMyReports() {
      try {
        setLoading(true);
        const res = await api.get('/reports/my');
        if (res.data.success) {
          setReports(res.data.reports || []);
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

  const recentReports = reports.slice(0, 5);

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      {/* Welcome Banner & Action */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Welcome back, {user?.name || 'Citizen'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Track and monitor the public issues you have submitted to city authorities.
          </p>
        </div>

        <Link to="/report" className="btn btn-primary btn-lg" style={{ gap: '0.5rem' }}>
          <PlusCircle size={18} /> Report a Problem
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid">
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

      {/* Recent Reports Panel */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Submissions</h2>
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
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              No reports submitted yet
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              Spot a pothole, broken streetlight, or garbage pile in your neighborhood? Click below to file your first report.
            </p>
            <Link to="/report" className="btn btn-primary">
              <PlusCircle size={16} /> Submit Your First Report
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
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {item.report_id}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.category}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                        <MapPin size={14} />
                        <span>{item.location}</span>
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
                    <td>
                      <Link to={`/reports/${item.report_id}`} className="btn btn-secondary btn-sm">
                        View Details
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
