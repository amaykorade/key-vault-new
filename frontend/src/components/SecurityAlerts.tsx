import React from 'react';
import type { AuditLog } from '../types';

interface SecurityAlertsProps {
  logs: AuditLog[];
}

export const SecurityAlerts: React.FC<SecurityAlertsProps> = ({ logs }) => {
  const getAlertIcon = (eventType: string) => {
    if (eventType === 'user_login' && logs.some(log => log.action === 'failed')) {
      return (
        <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      );
    }

    return (
      <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  const getAlertLevel = (log: AuditLog) => {
    if (log.eventType === 'user_login' && log.action === 'failed') {
      return 'high';
    }
    if (log.eventType === 'unauthorized_access') {
      return 'critical';
    }
    if (log.eventType === 'suspicious_activity') {
      return 'medium';
    }
    return 'low';
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10';
      case 'high':
        return 'border-red-400/50 bg-red-400/10';
      case 'medium':
        return 'border-yellow-400/50 bg-yellow-400/10';
      default:
        return 'border-gray-400/50 bg-gray-400/10';
    }
  };

  const getAlertTextColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const failedLogins = logs.filter(log => log.eventType === 'user_login' && log.action === 'failed');
  const otherSecurityEvents = logs.filter(log => log.eventType !== 'user_login' || log.action !== 'failed');

  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Failed Logins Summary */}
      {failedLogins.length > 0 && (
        <div className={`p-4 rounded-lg border ${getAlertColor('high')}`}>
          <div className="flex items-center space-x-3 mb-2">
            {getAlertIcon('user_login')}
            <div>
              <h3 className={`font-medium ${getAlertTextColor('high')}`}>
                Failed Login Attempts
              </h3>
              <p className="text-sm text-gray-400">
                {failedLogins.length} failed login attempt{failedLogins.length > 1 ? 's' : ''} detected
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {failedLogins.slice(0, 3).map((log) => (
              <div key={log.id} className="text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Failed login from {log.ipAddress || 'unknown IP'}</span>
                  <span className="text-xs text-gray-500">{formatTime(log.createdAt)}</span>
                </div>
                {log.userAgent && (
                  <div className="text-xs text-gray-500 truncate">
                    {log.userAgent}
                  </div>
                )}
              </div>
            ))}
            {failedLogins.length > 3 && (
              <div className="text-xs text-gray-500">
                +{failedLogins.length - 3} more failed attempts
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other Security Events */}
      {otherSecurityEvents.length > 0 && (
        <div className="space-y-2">
          {otherSecurityEvents.map((log) => {
            const level = getAlertLevel(log);
            return (
              <div key={log.id} className={`p-3 rounded-lg border ${getAlertColor(level)}`}>
                <div className="flex items-center space-x-3">
                  {getAlertIcon(log.eventType)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${getAlertTextColor(level)}`}>
                        {log.description || `${log.action} ${log.eventType}`}
                      </h4>
                      <span className="text-xs text-gray-500">{formatTime(log.createdAt)}</span>
                    </div>
                    
                    {log.user && (
                      <div className="text-sm text-gray-300 mt-1">
                        User: {log.user.name || log.user.email}
                      </div>
                    )}
                    
                    {log.resourceName && (
                      <div className="text-sm text-gray-300">
                        Resource: {log.resourceName}
                      </div>
                    )}
                    
                    {log.ipAddress && (
                      <div className="text-xs text-gray-500">
                        IP: {log.ipAddress}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
