import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import { ArrowLeft, MapPin, Calendar, Clock, AlertCircle, ImageIcon } from 'lucide-react';

export default function ReportDetailsPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const backendHost = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await api.get(`/reports/${id}`);
        if (res.data.success && res.data.report) {
          setReport(res.data.report);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load report details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading report details...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container" style={{ maxWidth: '600px', paddingTop: '3rem' }}>
        <div className="alert alert-danger">
          <AlertCircle size={16} /> {error || 'Report not found.'}
        </div>
        <Link to="/reports" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to My Reports
        </Link>
      </div>
    );
  }

  const imageUrl = report.image_url ? `${backendHost}${report.image_url}` : null;

  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Back navigation */}
      <Link to="/reports" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem', gap: '0.4rem' }}>
        <ArrowLeft size={15} /> Back to Reports
      </Link>

      <div className="card" style={{ marginBottom: '2rem' }}>
        {/* Header with ID and Status */}
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
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tracking Identifier
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', margin: '0.1rem 0' }}>
              {report.report_id}
            </h1>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {report.category}
            </div>
          </div>

          <div>
            <StatusBadge status={report.status} />
          </div>
        </div>

        {/* Status Lifecycle Timeline */}
        <div style={{ marginBottom: '2.5rem', marginTop: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>
            Resolution Progress
          </div>
          <Timeline status={report.status} />
        </div>

        {/* Location & Metadata */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          backgroundColor: 'var(--bg-muted)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>
              <MapPin size={14} color="var(--primary)" /> Location
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
              {report.location}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>
              <Calendar size={14} /> Submitted Date
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
              {new Date(report.created_at).toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>
              <Clock size={14} /> Last Updated
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
              {new Date(report.updated_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Description & Notes
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Attached Evidence
          </h2>
          {imageUrl ? (
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              maxWidth: '100%',
              backgroundColor: '#000'
            }}>
              <img
                src={imageUrl}
                alt={`Evidence for ${report.report_id}`}
                style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block' }}
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
              <span>No photographic evidence was attached to this report.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
