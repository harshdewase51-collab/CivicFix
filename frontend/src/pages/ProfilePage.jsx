import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { reportService, formatDate } from '@civicfix/client';
import UserAvatar from '../components/UserAvatar';
import { AVATAR_PRESETS } from '../assets/avatars';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Calendar, 
  Camera, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Sun, 
  Moon, 
  Laptop,
  FileText,
  Clock,
  Wrench,
  CheckCircle,
  Upload,
  Trash2,
  Check,
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, uploadAvatar, removeAvatar, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();

  // Avatar Management state
  const [selectedPreset, setSelectedPreset] = useState(user?.avatar_preset || 'avatar_01');
  const [avatarType, setAvatarType] = useState(user?.avatar_type || (user?.avatar_url ? 'custom' : 'preset'));
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState(null);
  const [avatarSaveLoading, setAvatarSaveLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [area, setArea] = useState(user?.area || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Personal activity stats
  const [activityStats, setActivityStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setArea(user.area || '');
      setSelectedPreset(user.avatar_preset || 'avatar_01');
      setAvatarType(user.avatar_type || (user.avatar_url ? 'custom' : 'preset'));
    }

    async function loadActivity() {
      try {
        const res = await reportService.getMyReports();
        if (res.success && res.reports) {
          const list = res.reports;
          setActivityStats({
            total: list.length,
            pending: list.filter((r) => r.status === 'PENDING').length,
            in_progress: list.filter((r) => r.status === 'IN_PROGRESS').length,
            resolved: list.filter((r) => r.status === 'RESOLVED').length
          });
        }
      } catch (err) {
        console.error('Activity stats fetch error:', err);
      }
    }
    loadActivity();
  }, [user]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pendingPhotoPreview) {
        URL.revokeObjectURL(pendingPhotoPreview);
      }
    };
  }, [pendingPhotoPreview]);

  // --- Avatar Handlers ---
  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    setAvatarType('preset');
    setPendingPhotoFile(null);
    if (pendingPhotoPreview) {
      URL.revokeObjectURL(pendingPhotoPreview);
      setPendingPhotoPreview(null);
    }
    setAvatarMessage({ type: '', text: '' });
  };

  const handleCustomPhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setAvatarMessage({ type: 'error', text: 'Please select a JPG, PNG, or WEBP image.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', text: 'Image is too large. Maximum allowed size is 5MB.' });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPendingPhotoFile(file);
    setPendingPhotoPreview(objectUrl);
    setAvatarType('custom');
    setAvatarMessage({ type: '', text: '' });
  };

  const handleRemoveCustomPhoto = async () => {
    setPendingPhotoFile(null);
    if (pendingPhotoPreview) {
      URL.revokeObjectURL(pendingPhotoPreview);
      setPendingPhotoPreview(null);
    }
    setAvatarType('preset');

    if (user?.avatar_url) {
      try {
        setAvatarSaveLoading(true);
        await removeAvatar();
        setAvatarMessage({ type: 'success', text: 'Profile updated successfully.' });
      } catch (err) {
        setAvatarMessage({ type: 'error', text: 'Unable to remove profile photo. Please try again.' });
      } finally {
        setAvatarSaveLoading(false);
      }
    } else {
      setAvatarMessage({ type: '', text: '' });
    }
  };

  const handleSaveAvatar = async () => {
    try {
      setAvatarSaveLoading(true);
      setAvatarMessage({ type: '', text: '' });

      if (avatarType === 'custom' && pendingPhotoFile) {
        const formData = new FormData();
        formData.append('photo', pendingPhotoFile);
        await uploadAvatar(formData);
        await updateProfile({ avatar_preset: selectedPreset, avatar_type: 'custom' });
        setPendingPhotoFile(null);
        setPendingPhotoPreview(null);
      } else if (avatarType === 'preset') {
        if (user?.avatar_url) {
          await removeAvatar();
        }
        await updateProfile({ avatar_preset: selectedPreset, avatar_type: 'preset' });
      }
      setAvatarMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setAvatarMessage({ type: 'error', text: err.response?.data?.message || 'Unable to update profile. Please try again.' });
    } finally {
      setAvatarSaveLoading(false);
    }
  };

  // --- Profile Details Form Handler ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!name.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    try {
      setProfileLoading(true);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        area: area.trim(),
        avatar_preset: selectedPreset,
        avatar_type: avatarType
      });
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Unable to save profile changes.');
    } finally {
      setProfileLoading(false);
    }
  };

  // --- Password Form Handler ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (!currentPassword || !newPassword) {
      setPassError('Please fill in both current and new passwords.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    try {
      setPassLoading(true);
      await changePassword({ currentPassword, newPassword });
      setPassSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.response?.data?.message || err.message || 'Unable to update password.');
    } finally {
      setPassLoading(false);
    }
  };

  const previewCustomUrl = pendingPhotoPreview || (avatarType === 'custom' ? user?.avatar_url : null);
  const hasCustomActive = avatarType === 'custom' && !!previewCustomUrl;

  const isAvatarModified =
    pendingPhotoFile !== null ||
    selectedPreset !== (user?.avatar_preset || 'avatar_01') ||
    avatarType !== (user?.avatar_type || (user?.avatar_url ? 'custom' : 'preset'));

  return (
    <div className="container" style={{ maxWidth: '860px', paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.95rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          Profile & Account Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Customize your civic identity, security credentials, and view personal activity metrics.
        </p>
      </div>

      {/* ========================================================
          1. PROFILE PHOTO & AVATAR SYSTEM SECTION
          ======================================================== */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            PROFILE PHOTO
          </span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          Your Civic Avatar
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Select an illustrated civic preset or upload your personal photograph. Your avatar appears across the navbar, dashboard, and tickets.
        </p>

        {avatarMessage.text && (
          <div className={`alert alert-${avatarMessage.type === 'error' ? 'danger' : 'success'}`} style={{ marginBottom: '1.25rem' }}>
            {avatarMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{avatarMessage.text}</span>
          </div>
        )}

        {/* Large Avatar Preview with Edit Controls */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.75rem 1rem',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          marginBottom: '2rem'
        }}>
          {/* Circular Avatar Container with Camera Button */}
          <div style={{ position: 'relative', width: '110px', height: '110px', marginBottom: '1rem' }}>
            <UserAvatar
              user={user}
              avatarUrl={previewCustomUrl}
              avatarPreset={selectedPreset}
              avatarType={avatarType}
              size={110}
              style={{
                border: '3px solid var(--primary)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
              }}
            />

            {/* Camera Edit Trigger Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile photo"
              title="Change profile photo"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: '2px solid var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                transition: 'transform 0.15s ease'
              }}
            >
              <Camera size={18} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleCustomPhotoSelect}
              style={{ display: 'none' }}
              aria-label="Upload profile photo file"
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {hasCustomActive ? 'Custom Photo Active' : `Preset: ${AVATAR_PRESETS.find(p => p.id === selectedPreset)?.name || 'Civic Preset'}`}
            </div>
            {pendingPhotoFile && (
              <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                (Unsaved Photo: {pendingPhotoFile.name})
              </span>
            )}
          </div>

          {/* Photo Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile photo"
              style={{ gap: '0.4rem' }}
            >
              <Upload size={14} /> Upload Custom Photo
            </button>

            {hasCustomActive && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleRemoveCustomPhoto}
                disabled={avatarSaveLoading}
                aria-label="Remove profile photo"
                style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)', gap: '0.4rem' }}
              >
                <Trash2 size={14} /> Remove Photo
              </button>
            )}
          </div>
        </div>

        {/* Preset Selection Grid */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
              CHOOSE AN AVATAR PRESET
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              10 standard illustrated municipal personas
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
            gap: '0.85rem'
          }}>
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = avatarType === 'preset' && selectedPreset === preset.id;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  aria-label={`Avatar preset: ${preset.name}`}
                  title={preset.name}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.6rem 0.35rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                    boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.25)' : 'var(--shadow-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', marginBottom: '0.35rem' }}>
                    <img
                      src={preset.src}
                      alt={`Avatar preset ${preset.name}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    maxWidth: '68px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {preset.name}
                  </span>

                  {/* Selected check badge */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Avatar Changes Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveAvatar}
            disabled={avatarSaveLoading || !isAvatarModified}
            style={{ minWidth: '160px' }}
          >
            {avatarSaveLoading ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ========================================================
          2. PERSONAL INFORMATION FORM
          ======================================================== */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            PERSONAL INFORMATION
          </span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
          Contact & Residential Information
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Keep your residential context and contact details updated for field dispatches.
        </p>

        {profileSuccess && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
            <CheckCircle2 size={16} /> {profileSuccess}
          </div>
        )}
        {profileError && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} /> {profileError}
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="prof-name">Full Name</label>
            <input
              id="prof-name"
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prof-email">Email Address (Read-only)</label>
            <input
              id="prof-email"
              type="email"
              className="form-control"
              value={user?.email || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-muted)', cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.2rem', display: 'block' }}>
              Email address is your verified identification key and cannot be altered.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="prof-phone">Phone Number</label>
              <input
                id="prof-phone"
                type="tel"
                className="form-control"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prof-area">Area / Ward / Neighborhood</label>
              <input
                id="prof-area"
                type="text"
                className="form-control"
                placeholder="e.g. Ward 14, Indiranagar"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={profileLoading}
            style={{ marginTop: '0.5rem' }}
          >
            {profileLoading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* ========================================================
          3. ACCOUNT & CIVIC ACTIVITY
          ======================================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Account Details Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ACCOUNT
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
            Membership Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Role</span>
              <span className={`role-pill ${user?.role === 'admin' ? 'admin' : ''}`}>
                {user?.role}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Member Since</span>
              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                {formatDate(user?.created_at)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Avatar Mode</span>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                {user?.avatar_type === 'custom' ? 'Custom Photo' : `Preset (${user?.avatar_preset || 'avatar_01'})`}
              </span>
            </div>
          </div>
        </div>

        {/* My Civic Activity Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              My Civic Activity
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Summary of complaints filed and resolution tracking from your account.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <FileText size={14} color="var(--primary)" /> Total Submitted
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {activityStats.total}
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--status-pending-bg)', border: '1px solid var(--status-pending-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--status-pending-text)', fontWeight: 600 }}>
                  <Clock size={14} /> Pending
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--status-pending-text)', marginTop: '0.2rem' }}>
                  {activityStats.pending}
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--status-progress-bg)', border: '1px solid var(--status-progress-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--status-progress-text)', fontWeight: 600 }}>
                  <Wrench size={14} /> In Progress
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--status-progress-text)', marginTop: '0.2rem' }}>
                  {activityStats.in_progress}
                </div>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--status-resolved-bg)', border: '1px solid var(--status-resolved-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--status-resolved-text)', fontWeight: 600 }}>
                  <CheckCircle size={14} /> Resolved
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--status-resolved-text)', marginTop: '0.2rem' }}>
                  {activityStats.resolved}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Personal Resolution Rate</span>
              <strong style={{ color: 'var(--text-main)' }}>
                {activityStats.total > 0
                  ? `${Math.round((activityStats.resolved / activityStats.total) * 100)}%`
                  : 'No reports yet'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. SECURITY & PASSWORD FORM
          ======================================================== */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            SECURITY
          </span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
          Change Password
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Ensure your account stays secure by choosing a robust password of at least 6 characters.
        </p>

        {passSuccess && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
            <CheckCircle2 size={16} /> {passSuccess}
          </div>
        )}
        {passError && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} /> {passError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="curr-pass">Current Password</label>
            <input
              id="curr-pass"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-pass">New Password</label>
              <input
                id="new-pass"
                type="password"
                className="form-control"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-pass">Confirm New Password</label>
              <input
                id="confirm-pass"
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            disabled={passLoading}
            style={{ marginTop: '0.5rem' }}
          >
            {passLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* ========================================================
          5. APPEARANCE & THEME SETTINGS
          ======================================================== */}
      <div className="card">
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
          Appearance & Theme
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Customize the visual contrast and interface styling of CivicFix.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          <button
            type="button"
            className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTheme('light')}
            style={{ justifyContent: 'flex-start', gap: '0.6rem' }}
          >
            <Sun size={18} /> Light
          </button>

          <button
            type="button"
            className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTheme('dark')}
            style={{ justifyContent: 'flex-start', gap: '0.6rem' }}
          >
            <Moon size={18} /> Dark
          </button>

          <button
            type="button"
            className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTheme('system')}
            style={{ justifyContent: 'flex-start', gap: '0.6rem' }}
          >
            <Laptop size={18} /> System Auto
          </button>
        </div>
      </div>
    </div>
  );
}
