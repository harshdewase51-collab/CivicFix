import React from 'react';

export default function Input({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error,
  hint,
  ...props
}) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label} {required && <span style={{ color: 'var(--danger-text)' }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
      {hint && <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.25rem', display: 'block' }}>{hint}</span>}
      {error && <span style={{ fontSize: '0.8rem', color: 'var(--danger-text)', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
    </div>
  );
}
