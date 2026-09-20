import React, { useState } from 'react';
import { getPresetAvatar, DEFAULT_AVATAR_PRESET } from '../assets/avatars';

export default function UserAvatar({
  user,
  avatarUrl,
  avatarPreset,
  avatarType,
  size = 36,
  className = '',
  style = {},
  alt
}) {
  const [imageError, setImageError] = useState(false);

  const effectiveType = avatarType || user?.avatar_type || (user?.avatar_url ? 'custom' : 'preset');
  const effectivePreset = avatarPreset || user?.avatar_preset || DEFAULT_AVATAR_PRESET;
  const rawUrl = avatarUrl !== undefined ? avatarUrl : user?.avatar_url;

  const backendHost = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

  let customSrc = null;
  if (rawUrl) {
    if (rawUrl.startsWith('http') || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
      customSrc = rawUrl;
    } else {
      customSrc = `${backendHost}${rawUrl}`;
    }
  }

  // Priority: Custom Photo (if type is custom or rawUrl exists and error is false) > Preset Avatar > Default Fallback
  const showCustom = effectiveType === 'custom' && !!customSrc && !imageError;
  const presetSrc = getPresetAvatar(effectivePreset);

  const displayName = user?.name || alt || 'User Avatar';

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-muted)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    verticalAlign: 'middle',
    userSelect: 'none',
    flexShrink: 0,
    ...style
  };

  if (showCustom) {
    return (
      <div className={`user-avatar ${className}`} style={containerStyle}>
        <img
          src={customSrc}
          alt={alt || `${displayName}'s profile photo`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`user-avatar ${className}`} style={containerStyle}>
      <img
        src={presetSrc}
        alt={alt || `${displayName}'s avatar (${effectivePreset})`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}
