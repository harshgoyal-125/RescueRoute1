import React from 'react';

export default function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  footer,
  ...props
}) {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {(title || subtitle || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="page-description">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer" style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--slate-100)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
