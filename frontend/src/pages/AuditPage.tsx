import React from 'react';
import { useParams } from 'react-router-dom';
import { AuditDashboard } from '../components/AuditDashboard';

export const AuditPage: React.FC = () => {
  const { organizationId, projectId } = useParams<{
    organizationId?: string;
    projectId?: string;
  }>();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AuditDashboard
          organizationId={organizationId}
          projectId={projectId}
        />
      </div>
    </div>
  );
};
