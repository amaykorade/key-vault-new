import React from 'react';
import type { AuditLog } from '../types';

interface ActivityTimelineProps {
  logs: AuditLog[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ logs }) => {
  const getEventIcon = (eventType: string, action: string) => {
    if (eventType === 'user_login') {
      return action === 'success' ? (
        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ) : (
        <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }

    if (eventType === 'secret_access') {
      return (
        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      );
    }

    if (eventType === 'secret_create') {
      return (
        <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      );
    }

    if (eventType === 'secret_update') {
      return (
        <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      );
    }

    if (eventType === 'secret_delete') {
      return (
        <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      );
    }

    if (eventType === 'project_create') {
      return (
        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
          </svg>
        </div>
      );
    }

    if (eventType === 'member_invite') {
      return (
        <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
      );
    }

    // Default icon
    return (
      <div className="w-8 h-8 bg-gray-500/20 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  const getEventColor = (eventType: string, action: string) => {
    if (eventType === 'user_login') {
      return action === 'success' ? 'text-green-400' : 'text-red-400';
    }
    if (eventType.startsWith('secret_')) {
      return 'text-blue-400';
    }
    if (eventType.startsWith('project_')) {
      return 'text-purple-400';
    }
    if (eventType.startsWith('member_')) {
      return 'text-indigo-400';
    }
    return 'text-gray-400';
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

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No activity yet</h3>
        <p className="text-gray-400">User activities will appear here once they start using the system.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log, index) => (
        <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all">
          {/* Icon */}
          {getEventIcon(log.eventType, log.action)}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`font-medium ${getEventColor(log.eventType, log.action)}`}>
                {log.description || `${log.action} ${log.eventType}`}
              </h4>
              <span className="text-xs text-gray-500">{formatTime(log.createdAt)}</span>
            </div>
            
            <div className="text-sm text-gray-400 space-y-1">
              {log.user && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-white">{log.user.name || log.user.email}</span>
                  <span className="text-gray-500">•</span>
                  <span>{log.user.email}</span>
                </div>
              )}
              
              {log.resourceName && (
                <div className="text-gray-300">
                  {log.resourceName}
                </div>
              )}
              
              {log.organization && (
                <div className="text-xs text-gray-500">
                  Organization: {log.organization.name}
                </div>
              )}
              
              {log.project && (
                <div className="text-xs text-gray-500">
                  Project: {log.project.name}
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
      ))}
    </div>
  );
};
