import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '@civicfix/client';
import { Upload, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

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
    <div className="container" style={{ maxWidth: '640px', paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
      <div className="card">
        <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
            Report a Civic Problem
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Submit photographic evidence and location context directly to municipal triage teams.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Problem Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="problem-category">
              Problem Category <span style={{ color: 'var(--danger-text)' }}>*</span>
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

          {/* Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="problem-location">
              Specific Location <span style={{ color: 'var(--danger-text)' }}>*</span>
            </label>
            <div>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.25rem', display: 'block' }}>
              Include nearby landmarks, cross streets, or building numbers for rapid field dispatch.
            </span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="problem-description">
              Problem Description <span style={{ color: 'var(--danger-text)' }}>*</span>
            </label>
            <textarea
              id="problem-description"
              className="form-control"
              rows={4}
              placeholder="Describe the issue in detail (e.g., depth of pothole, traffic impact, how long it has been broken)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Photo Upload */}
          <div className="form-group">
            <label className="form-label">
              Photo Evidence <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>(Optional but recommended)</span>
            </label>
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-muted)',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <input
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
                <Upload size={28} color="var(--primary)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {file ? file.name : 'Click or drop an image file here'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  Supports JPG, PNG, WEBP up to 5MB
                </span>
              </div>
            </div>

            {previewUrl && (
              <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                <img
                  src={previewUrl}
                  alt="Evidence preview"
                  style={{
                    maxHeight: '160px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Submitting Report to Municipal Queue...' : 'Submit Report'}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {successReport && (
        <div className="modal-overlay">
          <div className="modal-card">
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
                marginBottom: '1rem'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Report submitted successfully
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your complaint has been queued for municipal triage and action.
            </p>

            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.75rem',
                border: '1px solid var(--border)'
              }}
            >
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Your Official Report ID:
              </span>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: 'var(--primary)',
                  letterSpacing: '0.05em',
                  fontFamily: 'monospace',
                  marginTop: '0.2rem'
                }}
              >
                {successReport.report_id}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/reports/${successReport.report_id}`)}
              >
                Track Report <ArrowRight size={16} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSuccessReport(null);
                  setLocation('');
                  setDescription('');
                  setFile(null);
                  setPreviewUrl('');
                }}
              >
                Submit Another Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
