import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { AuditFilters as AuditFiltersType } from '../types';

interface AuditFiltersProps {
  filters: AuditFiltersType;
  onFiltersChange: (filters: AuditFiltersType) => void;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const eventTypes = [
    { value: '', label: 'All Events' },
    { value: 'user_login', label: 'User Login' },
    { value: 'user_logout', label: 'User Logout' },
    { value: 'secret_access', label: 'Secret Access' },
    { value: 'secret_create', label: 'Secret Create' },
    { value: 'secret_update', label: 'Secret Update' },
    { value: 'secret_delete', label: 'Secret Delete' },
    { value: 'project_create', label: 'Project Create' },
    { value: 'project_delete', label: 'Project Delete' },
    { value: 'member_invite', label: 'Member Invite' },
    { value: 'member_accept_invite', label: 'Member Accept Invite' },
  ];

  const handleEventTypeChange = (eventType: string) => {
    onFiltersChange({
      ...filters,
      eventType: eventType || undefined,
    });
  };

  const handleLimitChange = (limit: number) => {
    onFiltersChange({
      ...filters,
      limit: Math.max(1, Math.min(100, limit)),
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      organizationId: filters.organizationId,
      projectId: filters.projectId,
      limit: 50,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Event Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Event Type
        </label>
        <select
          value={filters.eventType || ''}
          onChange={(e) => handleEventTypeChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
        >
          {eventTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Limit Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Results Limit
        </label>
        <Input
          type="number"
          min="1"
          max="100"
          value={filters.limit || 50}
          onChange={(e) => handleLimitChange(Number(e.target.value))}
          placeholder="50"
          className="bg-gray-800/50 border-gray-600 text-white"
        />
      </div>

      {/* Actions */}
      <div className="flex items-end space-x-2">
        <Button
          variant="outline"
          onClick={handleClearFilters}
          className="hover:bg-gray-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </Button>
      </div>
    </div>
  );
};
