import React from 'react';

export default function Select({
  id,
  label,
  value,
  onChange,
  options = [],
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
      <select
        id={id}
        className="form-control"
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      >
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {hint && <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.25rem', display: 'block' }}>{hint}</span>}
      {error && <span style={{ fontSize: '0.8rem', color: 'var(--danger-text)', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
    </div>
  );
}
