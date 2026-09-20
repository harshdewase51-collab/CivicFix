import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportService, formatDateTime } from '@civicfix/client';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import CategoryIcon from '../components/CategoryIcon';
import { ArrowLeft, MapPin, Calendar, Clock, AlertCircle, ImageIcon, Copy, Check, Printer, Share2, ShieldCheck } from 'lucide-react';

export default function ReportDetailsPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const backendHost = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const res = await reportService.getReportById(id);
        if (res.success && res.report) {
          setReport(res.report);
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

  const handleCopyId = () => {
    if (!report?.report_id) return;
    navigator.clipboard.writeText(report.report_id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(err => console.error('Failed to copy ID', err));
  };

  const handlePrint = () => {
    window.print();
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const handleShare = () => {
    if (canShare && report) {
      navigator.share({
        title: `CivicFix Issue ${report.report_id}`,
        text: `CivicFix Issue ${report.report_id}: ${report.category} at ${report.location}`,
        url: window.location.href,
      }).catch((err) => {
        if (err.name !== 'AbortError') console.error('Share failed', err);
      });
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '820px', paddingTop: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
        <p style={{ fontWeight: 600 }}>Loading Civic Ticket {id}...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container" style={{ maxWidth: '640px', paddingTop: '3rem' }}>
        <div className="alert alert-danger">
          <AlertCircle size={18} /> {error || 'Report not found.'}
        </div>
        <Link to="/reports" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Reports
        </Link>
      </div>
    );
  }

  const imageUrl = report.image_url ? `${backendHost}${report.image_url}` : null;

  return (
    <div className="container" style={{ maxWidth: '820px', paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Back and Action Toolbar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link to="/reports" className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
          <ArrowLeft size={15} /> Back to Reports
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopyId}
            title="Copy Report Identifier to clipboard"
            style={{ minWidth: '95px' }}
          >
            {copied ? (
              <>
                <Check size={14} color="var(--accent)" /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy ID
              </>
            )}
          </button>

          {canShare && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleShare}
              title="Share this report"
            >
              <Share2 size={14} /> Share
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrint}
            title="Print Civic Ticket"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* CIVIC TICKET PRESENTATION */}
      <div className="civic-ticket card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Ticket Header Brand Bar */}
        <div style={{
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          padding: '1rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={20} />
            <span style={{ fontWeight: 800, letterSpacing: '0.04em', fontSize: '0.95rem', textTransform: 'uppercase' }}>
              CivicFix Official Ticket
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', opacity: 0.9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Public Municipal Registry
          </span>
        </div>

        <div style={{ padding: '1.75rem' }}>
          {/* Header with Prominent ID and Category */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '1.5rem',
            marginBottom: '1.75rem'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Ticket Identifier
              </div>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: 'var(--primary)',
                fontFamily: 'monospace',
                margin: '0.2rem 0',
                letterSpacing: '0.02em'
              }}>
                {report.report_id}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <CategoryIcon category={report.category} size={20} color="var(--primary)" />
                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {report.category}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <StatusBadge status={report.status} />
              <button
                type="button"
                className="btn btn-secondary btn-sm no-print"
                onClick={handleCopyId}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              >
                {copied ? '✓ Copied' : 'Copy ID'}
              </button>
            </div>
          </div>

          {/* Report Lifecycle Timeline */}
          <div style={{ marginBottom: '2.5rem', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem', textAlign: 'center' }}>
              Official Resolution Progression
            </div>
            <Timeline
              status={report.status}
              createdAt={report.created_at}
              updatedAt={report.updated_at}
            />
          </div>

          {/* Location & Metadata Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1.25rem',
            backgroundColor: 'var(--bg-muted)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                <MapPin size={14} color="var(--primary)" /> Incident Location
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 600, marginTop: '0.3rem', color: 'var(--text-main)' }}>
                {report.location}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                <Calendar size={14} /> Reported At
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.3rem', color: 'var(--text-main)' }}>
                {formatDateTime(report.created_at)}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                <Clock size={14} /> Last Updated
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.3rem', color: 'var(--text-main)' }}>
                {formatDateTime(report.updated_at)}
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div style={{ marginBottom: '2.25rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
              Citizen Statement & Description
            </h2>
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-surface)',
              lineHeight: 1.65,
              whiteSpace: 'pre-line',
              color: 'var(--text-main)',
              fontSize: '0.95rem'
            }}>
              {report.description}
            </div>
          </div>

          {/* Evidence Photo */}
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-main)', marginBottom: '0.6rem' }}>
              Photographic Evidence
            </h2>
            {imageUrl ? (
              <div style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                maxWidth: '100%',
                backgroundColor: '#000',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <img
                  src={imageUrl}
                  alt={`Evidence for ${report.report_id}`}
                  style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div style={{
                padding: '2.25rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px dashed var(--border)'
              }}>
                <ImageIcon size={30} color="var(--text-subtle)" />
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>No photographic evidence was attached to this ticket.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

