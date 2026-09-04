import React from 'react';

export default function PageHeader({ title, description, crumbs, actions }) {
  return (
    <div className="page-header">
      <div>
        {crumbs?.length > 0 && (
          <div className="crumbs">
            {crumbs.map((crumb, index) => (
              <React.Fragment key={crumb}>
                {index > 0 && <span aria-hidden="true">/</span>}
                <span>{crumb}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
