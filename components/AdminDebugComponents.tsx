"use client";

import { useAdminView } from './AdminViewProvider';
import { useState } from 'react';

interface AdminDebugPanelProps {
  title: string;
  data: Record<string, any>;
  collapsible?: boolean;
  className?: string;
}

export function AdminDebugPanel({ 
  title, 
  data, 
  collapsible = true,
  className = '' 
}: AdminDebugPanelProps) {
  const { isAdmin, adminViewEnabled } = useAdminView();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isAdmin || !adminViewEnabled) return null;

  return (
    <div className={`admin-debug ${className}`}>
      <div className="admin-debug-header" onClick={() => collapsible && setIsCollapsed(!isCollapsed)}>
        <span className="admin-debug-icon">🔍</span>
        <span className="admin-debug-title">{title}</span>
        {collapsible && (
          <span className="admin-debug-toggle">{isCollapsed ? '▼' : '▲'}</span>
        )}
      </div>
      
      {!isCollapsed && (
        <div className="admin-debug-content">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="admin-debug-row">
              <span className="admin-debug-key">{key}:</span>
              <span className="admin-debug-value">
                {typeof value === 'object' 
                  ? <pre>{JSON.stringify(value, null, 2)}</pre>
                  : String(value)
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AdminDebugTooltipProps {
  label: string;
  value: any;
  className?: string;
}

export function AdminDebugTooltip({ label, value, className = '' }: AdminDebugTooltipProps) {
  const { isAdmin, adminViewEnabled } = useAdminView();

  if (!isAdmin || !adminViewEnabled) return null;

  return (
    <span className={`admin-debug-tooltip ${className}`} title={`${label}: ${value}`}>
      <span className="admin-debug-tooltip-icon">ℹ️</span>
      <span className="admin-debug-tooltip-content">
        {label}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
      </span>
    </span>
  );
}

interface AdminDebugBoxProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function AdminDebugBox({ children, label, className = '' }: AdminDebugBoxProps) {
  const { isAdmin, adminViewEnabled } = useAdminView();

  if (!isAdmin || !adminViewEnabled) return <>{children}</>;

  return (
    <div className={`admin-debug-box ${className}`}>
      {label && <div className="admin-debug-box-label">{label}</div>}
      {children}
    </div>
  );
}
