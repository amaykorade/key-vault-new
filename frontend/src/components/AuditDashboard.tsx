import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { apiService } from '../services/api';
import type { AuditLog, AuditFilters } from '../types';
import { ActivityTimeline } from './ActivityTimeline';
import { SecurityAlerts } from './SecurityAlerts';
import { AuditFilters as AuditFiltersComponent } from './AuditFilters';

interface AuditDashboardProps {
  organizationId?: string;
  projectId?: string;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  organizationId,
  projectId,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [securityLogs, setSecurityLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({
    organizationId,
    projectId,
    limit: 50,
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsResponse, securityResponse] = await Promise.all([
        apiService.getAuditLogs(filters),
        apiService.getSecurityEvents(organizationId),
      ]);
      
      setLogs(logsResponse.logs);
      setSecurityLogs(securityResponse.logs);
    } catch (error) {
      console.error('Failed to fetch audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: AuditFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-gray-400">Loading audit logs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Audit Dashboard</h1>
          <p className="text-gray-400 mt-1">Monitor user activities and security events</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="hover:bg-gray-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Security Alerts */}
      {securityLogs.length > 0 && (
        <SecurityAlerts logs={securityLogs} />
      )}

      {/* Filters */}
      <Card className="hover-lift">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center">
            <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <AuditFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="hover-lift">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center">
            <svg className="w-5 h-5 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Activity ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ActivityTimeline logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
};
