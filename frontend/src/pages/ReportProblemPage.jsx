import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '@civicfix/client';
import CategoryIcon from '../components/CategoryIcon';
import StatusBadge from '../components/StatusBadge';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  X,
  FileText,
  MapPin,
  Camera,
  Layers,
  HelpCircle
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

export default function ReportProblemPage() {
  const [category, setCategory] = useState('Pothole');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successReport, setSuccessReport] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError('Image file exceeds the 5MB size limit.');
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setError('');
    }
  };

  const handleRemovePhoto = () => {
    setFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!category || !location.trim() || !description.trim()) {
      setError('Please provide a category, location, and description.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('category', category);
      formData.append('location', location.trim());
      formData.append('description', description.trim());
      if (file) {
        formData.append('image', file);
      }

      const res = await reportService.createReport(formData);

      if (res.success && res.report) {
        setSuccessReport(res.report);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit report. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '720px', paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      {/* Page Title & Context */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          Report a Community Issue
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Follow the 4 simple steps below to record and dispatch your civic issue directly to local authorities.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* STEP 1: WHAT IS THE PROBLEM? */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              STEP 1
            </span>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
            WHAT IS THE PROBLEM?
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    padding: '0.85rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.85rem',
                    textAlign: 'center'
                  }}
                >
                  <CategoryIcon category={cat} size={22} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="problem-category" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Selected Category:
            </label>
            <select
              id="problem-category"
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STEP 2: WHERE IS IT? */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              STEP 2
            </span>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
            WHERE IS IT?
          </h2>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="problem-location">
              Street, Intersection, or Landmark <span style={{ color: 'var(--danger-text)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="problem-location"
                type="text"
                className="form-control"
                placeholder="e.g. Main Road & 4th Cross, near Central Bus Stop"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.35rem', display: 'block' }}>
              Provide accurate cross streets or building markers so municipal field teams can locate the site swiftly.
            </span>
          </div>
        </div>

        {/* STEP 3: TELL US MORE */}
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              STEP 3
            </span>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
            TELL US MORE
          </h2>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="problem-description">
              Problem Description & Severity <span style={{ color: 'var(--danger-text)' }}>*</span>
            </label>
            <textarea
              id="problem-description"
              className="form-control"
              rows={4}
              placeholder="Describe the issue in detail (e.g. depth of pothole, traffic hazard, water pooling, approximate duration broken)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.35rem', display: 'block' }}>
              Specific context helps engineers allocate appropriate repair equipment and urgency.
            </span>
          </div>
        </div>

        {/* STEP 4: ADD EVIDENCE */}
        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8b5cf6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              STEP 4
            </span>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
            ADD EVIDENCE
          </h2>

          {!file ? (
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-muted)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={24} color="var(--primary)" />
                </div>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Click or drag photo evidence here
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Supports JPG, JPEG, PNG, WEBP up to 5MB (Optional but highly recommended)
                </span>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              border: '1px solid var(--border)'
            }}>
              {previewUrl && (
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <img
                    src={previewUrl}
                    alt="Evidence preview"
                    style={{
                      maxHeight: '220px',
                      maxWidth: '100%',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <Camera size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}
                >
                  <X size={14} /> Remove Photo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', fontWeight: 800 }}
            disabled={loading}
          >
            {loading ? 'Submitting Report to Municipal Queue...' : 'SUBMIT CIVIC REPORT'}
          </button>
        </div>
      </form>

      {/* PART 16: SUCCESS EXPERIENCE MODAL */}
      {successReport && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
          <div className="modal-card" style={{ maxWidth: '480px', textAlign: 'center', padding: '2rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--status-resolved-bg)',
                color: 'var(--status-resolved-text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              ✓ REPORT SUBMITTED
            </div>
            <h2 id="success-modal-title" style={{ fontSize: '1.45rem', fontWeight: 900, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Your civic issue has been registered.
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              The report is queued for municipal inspection and tracking.
            </p>

            {/* Official Report Ticket Badge */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.75rem',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                  CIVICFIX ID
                </span>
                <div
                  style={{
                    fontSize: '2.1rem',
                    fontWeight: 900,
                    color: 'var(--primary)',
                    letterSpacing: '0.04em',
                    fontFamily: 'monospace',
                    marginTop: '0.1rem'
                  }}
                >
                  {successReport.report_id}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                  STATUS:
                </span>
                <StatusBadge status={successReport.status || 'PENDING'} />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                id="view-report-btn"
                className="btn btn-primary"
                onClick={() => navigate(`/reports/${successReport.report_id}`)}
              >
                View Report <ArrowRight size={16} />
              </button>
              <button
                id="go-to-my-reports-btn"
                className="btn btn-secondary"
                onClick={() => navigate('/reports')}
              >
                My Reports
              </button>
              <button
                id="submit-another-btn"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.25rem' }}
                onClick={() => {
                  setSuccessReport(null);
                  setLocation('');
                  setDescription('');
                  setFile(null);
                  setPreviewUrl('');
                }}
              >
                Submit Another Problem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

