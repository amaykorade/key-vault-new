import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface SecretFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedEnvironment: string;
  onEnvironmentChange: (env: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedFolder: string;
  onFolderChange: (folder: string) => void;
  onClearFilters: () => void;
  existingFolders?: string[];
  showHeader?: boolean;
}

const ENVIRONMENTS = [
  { value: 'all', label: 'All Environments' },
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

const SECRET_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'API_KEY', label: 'API Key' },
  { value: 'DATABASE_URL', label: 'Database URL' },
  { value: 'JWT_SECRET', label: 'JWT Secret' },
  { value: 'OAUTH_CLIENT_SECRET', label: 'OAuth Client Secret' },
  { value: 'WEBHOOK_SECRET', label: 'Webhook Secret' },
  { value: 'SSH_KEY', label: 'SSH Key' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'PASSWORD', label: 'Password' },
  { value: 'OTHER', label: 'Other' },
];

const COMMON_FOLDERS = [
  { value: 'all', label: 'All Folders' },
  { value: 'database', label: 'Database' },
  { value: 'auth', label: 'Authentication' },
  { value: 'payment', label: 'Payment' },
  { value: 'api', label: 'API Keys' },
  { value: 'webhooks', label: 'Webhooks' },
  { value: 'external', label: 'External Services' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'microservices', label: 'Microservices' },
  { value: 'third-party', label: 'Third Party' },
  { value: 'default', label: 'Default' },
];

export function SecretFilters({
  searchQuery,
  onSearchChange,
  selectedEnvironment,
  onEnvironmentChange,
  selectedType,
  onTypeChange,
  selectedFolder,
  onFolderChange,
  onClearFilters,
  existingFolders = [],
  showHeader = true,
}: SecretFiltersProps) {
  const hasActiveFilters = searchQuery || selectedEnvironment !== 'all' || selectedType !== 'all' || selectedFolder !== 'all';

  // Create dynamic folders list including existing custom folders
  const allFolders = [
    { value: 'all', label: 'All Folders' },
    ...COMMON_FOLDERS.slice(1), // Skip the first "All Folders" entry
    ...existingFolders
      .filter(folder => folder && !COMMON_FOLDERS.some((f: { value: string; label: string }) => f.value === folder))
      .map(folder => ({ 
        value: folder, 
        label: folder.charAt(0).toUpperCase() + folder.slice(1).replace(/_/g, ' ') 
      }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Filter Secrets</h3>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search secrets by name or description..."
            className="pl-12 pr-4 h-12 bg-gray-800/30 border-gray-600/50 focus:border-blue-500/50 focus:bg-gray-800/50 transition-all duration-200"
          />
          <svg 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Environment Filter */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-300">
            <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Environment
          </label>
          <select
            value={selectedEnvironment}
            onChange={(e) => onEnvironmentChange(e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-600/50 bg-gray-800/30 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:bg-gray-800/50 transition-all duration-200"
          >
            {ENVIRONMENTS.map((env) => (
              <option key={env.value} value={env.value}>
                {env.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-300">
            <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Secret Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-600/50 bg-gray-800/30 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200"
          >
            {SECRET_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Folder Filter */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-300">
            <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Folder
          </label>
          <div className="relative">
            <input
              value={selectedFolder === 'all' ? '' : selectedFolder}
              onChange={(e) => onFolderChange(e.target.value || 'all')}
              list="filter-folder-suggestions"
              placeholder="All folders"
              className="w-full h-11 rounded-xl border border-gray-600/50 bg-gray-800/30 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 hover:bg-gray-800/50 transition-all duration-200"
              autoComplete="off"
            />
            <datalist id="filter-folder-suggestions">
              {allFolders.slice(1).map((folder) => (
                <option key={folder.value} value={folder.value}>
                  {folder.label}
                </option>
              ))}
            </datalist>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <span className="text-sm font-medium text-gray-300">Active Filters</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium border border-blue-500/30">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                "{searchQuery}"
              </span>
            )}
            {selectedEnvironment !== 'all' && (
              <span className="inline-flex items-center px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium border border-emerald-500/30">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {selectedEnvironment.charAt(0).toUpperCase() + selectedEnvironment.slice(1)}
              </span>
            )}
            {selectedType !== 'all' && (
              <span className="inline-flex items-center px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium border border-purple-500/30">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {SECRET_TYPES.find(t => t.value === selectedType)?.label || selectedType}
              </span>
            )}
            {selectedFolder !== 'all' && (
              <span className="inline-flex items-center px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium border border-orange-500/30">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {allFolders.find(f => f.value === selectedFolder)?.label || selectedFolder}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
