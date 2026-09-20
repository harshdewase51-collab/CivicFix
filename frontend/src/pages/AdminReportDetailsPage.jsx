import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService, formatDateTime } from '@civicfix/client';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ImageIcon,
  ShieldCheck
} from 'lucide-react';

export default function AdminReportDetailsPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const backendHost = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getAdminReportById(id);
      if (res.success && res.report) {
        setReport(res.report);
        setSelectedStatus(res.report.status);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report dossier.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setError('');

    try {
      setUpdating(true);
      const res = await adminService.updateReportStatus(id, selectedStatus);

      if (res.success) {
        setSuccessMsg(`Status successfully updated to ${selectedStatus.replace('_', ' ')}.`);
        setReport(res.report);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update report status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading administrative report dossier...
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="container" style={{ maxWidth: '600px', paddingTop: '3rem' }}>
        <div className="alert alert-danger">
          <AlertCircle size={16} /> {error}
        </div>
        <Link to="/admin" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Admin Dashboard
        </Link>
      </div>
    );
  }

  const imageUrl = report.image_url ? `${backendHost}${report.image_url}` : null;

  return (
    <div className="container" style={{ maxWidth: '880px', paddingTop: '2rem', paddingBottom: '4rem' }}>
      <Link to="/admin" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem', gap: '0.4rem' }}>
        <ArrowLeft size={15} /> Back to Admin Dashboard
      </Link>

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Main Dossier Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        {/* Header with ID and current status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <span style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              MUNICIPAL TICKET DOSSIER
            </span>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              fontFamily: 'monospace',
              margin: '0.1rem 0'
            }}>
              {report.report_id}
            </h1>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Category: {report.category}
            </div>
          </div>

          <div>
            <StatusBadge status={report.status} />
          </div>
        </div>

        {/* Status Lifecycle Timeline */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem' }}>
            Current Citizen-Facing Resolution Timeline
          </div>
          <Timeline status={report.status} />
        </div>

        {/* Administrative Action Bar */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            <ShieldCheck size={18} color="var(--primary)" /> Administrative Status Update
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Select the new operational status. This immediately updates municipal database records and notifies the citizen.
          </p>

          <form onSubmit={handleStatusUpdate} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <select
                className="form-control"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ fontWeight: 600 }}
              >
                <option value="PENDING">PENDING (Triage & Review)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Dispatched & Active)</option>
                <option value="RESOLVED">RESOLVED (Verified Complete)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={updating || selectedStatus === report.status}
              style={{ minWidth: '150px' }}
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </form>
        </div>

        {/* Submitter & Incident Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          {/* Citizen Details */}
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Reporting Citizen
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '1rem' }}>
              <User size={16} color="var(--primary)" /> {report.citizen_name || 'Anonymous Resident'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              <Mail size={15} /> {report.citizen_email}
            </div>
          </div>

          {/* Location & Dates */}
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-muted)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Incident Details
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
              <MapPin size={15} color="var(--primary)" /> <strong>{report.location}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              <Calendar size={14} /> Created: {formatDateTime(report.created_at)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              <Clock size={14} /> Modified: {formatDateTime(report.updated_at)}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Complaint Description
          </h2>
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            backgroundColor: '#FFFFFF',
            lineHeight: 1.6,
            whiteSpace: 'pre-line'
          }}>
            {report.description}
          </div>
        </div>

        {/* Evidence Photo */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Attached Photo Evidence
          </h2>
          {imageUrl ? (
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              backgroundColor: '#000'
            }}>
              <img
                src={imageUrl}
                alt={`Evidence for ${report.report_id}`}
                style={{ width: '100%', maxHeight: '440px', objectFit: 'contain', display: 'block' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div style={{
              padding: '2rem',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ImageIcon size={28} color="var(--text-subtle)" />
              <span>No photo was attached to this report.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
