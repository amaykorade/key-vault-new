import { useState, useRef, useCallback } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { parseEnvFile, detectSecretType } from '../lib/env-parser';
import type { Secret } from '../types';

interface EnvImportModalProps {
  projectId: string;
  environment: string;
  folder: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedSecret {
  name: string;
  value: string;
  lineNumber: number;
  rawLine: string;
}

interface Conflict {
  name: string;
  exists: boolean;
}

export function EnvImportModal({
  projectId,
  environment,
  folder,
  onClose,
  onSuccess,
}: EnvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState<string>('');
  const [parsedSecrets, setParsedSecrets] = useState<ParsedSecret[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [parseErrors, setParseErrors] = useState<Array<{ line: number; error: string; rawLine: string }>>([]);
  const [conflictResolution, setConflictResolution] = useState<'skip' | 'overwrite'>('skip');
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSecrets, setSelectedSecrets] = useState<Set<string>>(new Set());

  // Check for conflicts with existing secrets
  const checkConflicts = useCallback(async (secretNames: string[]) => {
    if (secretNames.length === 0) {
      setConflicts([]);
      return;
    }

    setIsCheckingConflicts(true);
    try {
      // Get all secrets for the project, then filter by environment and folder
      const response = await apiService.getSecrets(projectId, false);
      const existingSecrets = response.secrets.filter((s: Secret) => 
        s.environment === environment && s.folder === folder
      );
      const existingNames = new Set(existingSecrets.map((s: Secret) => s.name));
      const newConflicts: Conflict[] = secretNames.map(name => ({
        name,
        exists: existingNames.has(name),
      }));
      setConflicts(newConflicts);
    } catch (error) {
      console.error('Failed to check secret conflicts:', error);
      toast.error('Failed to check for existing secrets. Import will proceed, but conflicts may occur.');
      setConflicts([]);
    } finally {
      setIsCheckingConflicts(false);
    }
  }, [projectId, environment, folder]);

  // Parse .env file content
  const parseEnvContent = useCallback((text: string) => {
    const result = parseEnvFile(text);
    setParsedSecrets(result.secrets);
    setParseErrors(result.errors);
    
    // Initialize all secrets as selected
    const secretNames = result.secrets.map(s => s.name);
    setSelectedSecrets(new Set(secretNames));
    
    // Check for conflicts with existing secrets
    if (secretNames.length > 0) {
      checkConflicts(secretNames);
    } else {
      setConflicts([]);
    }
  }, [checkConflicts]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type (accept text files)
    const validExtensions = ['.txt', '.env', '.env.local', '.env.production', '.config', '.properties'];
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension && !selectedFile.type.startsWith('text/')) {
      toast.error('Please select a text file (.txt, .env, .config, etc.)');
      return;
    }

    // Validate file size (1MB max)
    if (selectedFile.size > 1024 * 1024) {
      toast.error('File too large. Maximum size is 1MB.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      parseEnvContent(text);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(selectedFile);
  };

  // Parse content whenever it changes (for paste or typing)
  const handleContentChange = (text: string) => {
    setContent(text);
    if (text.trim()) {
      parseEnvContent(text);
    } else {
      setParsedSecrets([]);
      setParseErrors([]);
      setSelectedSecrets(new Set());
      setFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    // Validate file type
    const validExtensions = ['.txt', '.env', '.env.local', '.env.production', '.config', '.properties'];
    const fileName = droppedFile.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension && !droppedFile.type.startsWith('text/')) {
      toast.error('Please drop a text file (.txt, .env, .config, etc.)');
      return;
    }

    // Validate file size
    if (droppedFile.size > 1024 * 1024) {
      toast.error('File too large. Maximum size is 1MB.');
      return;
    }

    setFile(droppedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      parseEnvContent(text);
    };
    reader.readAsText(droppedFile);
  };

  const toggleSecret = (name: string) => {
    const newSelected = new Set(selectedSecrets);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedSecrets(newSelected);
  };

  const handleImport = async () => {
    if (parsedSecrets.length === 0) {
      toast.error('No secrets to import');
      return;
    }

    const secretsToImport = parsedSecrets.filter(s => selectedSecrets.has(s.name));
    if (secretsToImport.length === 0) {
      toast.error('Please select at least one secret to import');
      return;
    }

    setIsImporting(true);
    const loadingToast = toast.loading(`Importing ${secretsToImport.length} secrets...`);

    try {
      // Reconstruct .env content with only selected secrets
      const envContent = secretsToImport.map(s => s.rawLine).join('\n');

      const result = await apiService.importSecretsFromEnv(
        projectId,
        envContent,
        environment,
        folder,
        conflictResolution
      );

      toast.dismiss(loadingToast);

      if (result.summary.failed > 0) {
        toast.error(
          `Import completed with errors: ${result.summary.imported} imported, ${result.summary.failed} failed`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `Successfully imported ${result.summary.imported} secrets${result.summary.skipped > 0 ? ` (${result.summary.skipped} skipped)` : ''}`,
          { duration: 4000 }
        );
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to import secrets');
    } finally {
      setIsImporting(false);
    }
  };

  const validSecrets = parsedSecrets.filter(s => selectedSecrets.has(s.name));
  const selectedConflicts = validSecrets.filter(s => {
    const conflict = conflicts.find(c => c.name === s.name);
    return conflict?.exists === true;
  });
  const selectedNew = validSecrets.filter(s => {
    const conflict = conflicts.find(c => c.name === s.name);
    return conflict?.exists !== true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-gray-800 bg-gray-900/95">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Import Secrets from Environment File</CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Importing to: <span className="text-emerald-400 font-medium">{environment}</span> / <span className="text-emerald-400 font-medium">{folder}</span>
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pt-6">
          <div className="space-y-4">
            {/* Primary: Paste Area */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Paste Environment Variables (Recommended)
              </label>
              <p className="text-gray-400 text-xs mb-3">
                Copy and paste your .env file content here. Some systems block .env file uploads, so pasting is the most reliable method.
              </p>
              <textarea
                className="w-full h-48 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm resize-none"
                placeholder="DATABASE_URL=postgresql://user:pass@localhost:5432/dbname&#10;API_KEY=sk_live_1234567890&#10;STRIPE_SECRET_KEY=sk_test_...&#10;GITHUB_TOKEN=ghp_...&#10;# Comments are ignored&#10;&#10;Paste your environment variables here..."
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
              />
            </div>

            {/* Secondary: File Upload */}
            <div className="border-t border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Or Upload a File (Alternative)
              </label>
              <div
                className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-emerald-500/50 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.env,.env.local,.env.production,.config,.properties,text/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-300 text-sm mb-1">Click to browse or drag & drop</p>
                <p className="text-gray-500 text-xs">Accepts .txt, .env, .config, .properties files (max 1MB)</p>
                <p className="text-gray-500 text-xs mt-2">💡 Tip: If .env files are blocked, rename to .txt or paste content above</p>
              </div>
            </div>
          </div>

          {content && (
            <div className="space-y-6">
              {/* File Info */}
              {file && (
                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setContent('');
                      setParsedSecrets([]);
                      setConflicts([]);
                      setParseErrors([]);
                      setSelectedSecrets(new Set());
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Parse Errors */}
              {parseErrors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-400 font-medium">Parse Errors ({parseErrors.length})</p>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {parseErrors.map((error, idx) => (
                      <p key={idx} className="text-red-300 text-sm">
                        Line {error.line}: {error.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {parsedSecrets.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white font-medium">
                        Preview ({parsedSecrets.length} secrets found)
                      </p>
                      <p className="text-gray-400 text-sm">
                        {validSecrets.length} selected for import
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedSecrets(new Set(parsedSecrets.map(s => s.name)))}
                        className="text-sm text-emerald-400 hover:text-emerald-300"
                      >
                        Select All
                      </button>
                      <span className="text-gray-600">|</span>
                      <button
                        onClick={() => setSelectedSecrets(new Set())}
                        className="text-sm text-gray-400 hover:text-gray-300"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedSecrets.size === parsedSecrets.length && parsedSecrets.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSecrets(new Set(parsedSecrets.map(s => s.name)));
                                } else {
                                  setSelectedSecrets(new Set());
                                }
                              }}
                              className="rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Key</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Value Preview</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {parsedSecrets.map((secret, idx) => {
                          const isSelected = selectedSecrets.has(secret.name);
                          const detectedType = detectSecretType(secret.name, secret.value);
                          const valuePreview = secret.value.length > 50 
                            ? `${secret.value.substring(0, 50)}...` 
                            : secret.value;

                          return (
                            <tr
                              key={idx}
                              className={`hover:bg-gray-800/30 ${!isSelected ? 'opacity-50' : ''}`}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSecret(secret.name)}
                                  className="rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <code className="text-emerald-400 text-sm">{secret.name}</code>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                                  {detectedType}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <code className="text-gray-400 text-xs font-mono">{valuePreview}</code>
                              </td>
                              <td className="px-4 py-3">
                                {(() => {
                                  const conflict = conflicts.find(c => c.name === secret.name);
                                  if (conflict?.exists) {
                                    return (
                                      <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                                        ⚠️ Exists
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
                                      ✓ New
                                    </span>
                                  );
                                })()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Summary & Conflict Resolution */}
              {validSecrets.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
                  <div>
                    <p className="text-gray-300 font-medium mb-3">Import Summary</p>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">New Secrets</p>
                        <p className="text-emerald-400 text-2xl font-bold">{selectedNew.length}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Existing Secrets</p>
                        <p className="text-yellow-400 text-2xl font-bold">{selectedConflicts.length}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">Total Selected</p>
                        <p className="text-white text-2xl font-bold">{validSecrets.length}</p>
                      </div>
                    </div>
                  </div>

                  {selectedConflicts.length > 0 && (
                    <div>
                      <p className="text-gray-300 font-medium mb-3">Conflict Resolution</p>
                      <p className="text-gray-400 text-sm mb-3">
                        {selectedConflicts.length} secret{selectedConflicts.length !== 1 ? 's' : ''} already exist{selectedConflicts.length !== 1 ? '' : 's'}. How would you like to handle them?
                      </p>
                      <div className="space-y-3">
                        <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border-2 border-transparent hover:border-gray-600 transition-colors bg-gray-900/30">
                          <input
                            type="radio"
                            checked={conflictResolution === 'skip'}
                            onChange={() => setConflictResolution('skip')}
                            className="mt-1 text-emerald-500 focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <span className="text-gray-300 font-medium block mb-1">Skip existing secrets (Recommended)</span>
                            <span className="text-gray-400 text-xs">
                              Keep the current values. {selectedConflicts.length} secret{selectedConflicts.length !== 1 ? 's will' : ' will'} be skipped, {selectedNew.length} new secret{selectedNew.length !== 1 ? 's will' : ' will'} be imported.
                            </span>
                          </div>
                        </label>
                        <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border-2 border-transparent hover:border-gray-600 transition-colors bg-gray-900/30">
                          <input
                            type="radio"
                            checked={conflictResolution === 'overwrite'}
                            onChange={() => setConflictResolution('overwrite')}
                            className="mt-1 text-emerald-500 focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <span className="text-gray-300 font-medium block mb-1">Overwrite existing secrets</span>
                            <span className="text-gray-400 text-xs">
                              Replace current values with imported ones. {selectedConflicts.length} secret{selectedConflicts.length !== 1 ? 's will' : ' will'} be overwritten, {selectedNew.length} new secret{selectedNew.length !== 1 ? 's will' : ' will'} be imported.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {selectedConflicts.length === 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                      <p className="text-emerald-400 text-sm">
                        ✓ All {validSecrets.length} secret{validSecrets.length !== 1 ? 's are' : ' is'} new and will be imported.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <div className="border-t border-gray-800 p-6 flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={handleImport}
            disabled={isImporting || parsedSecrets.length === 0 || validSecrets.length === 0}
            loading={isImporting}
          >
            {isImporting 
              ? `Importing ${validSecrets.length} secrets...` 
              : `Import ${validSecrets.length} Secret${validSecrets.length !== 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </Card>
    </div>
  );
}

