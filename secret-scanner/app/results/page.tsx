'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

interface ScanResult {
  filePath: string;
  findings: Array<{
    pattern: string;
    severity: 'high' | 'medium' | 'low';
    match: string;
    line: number;
    context: string;
  }>;
}

interface ScanData {
  success: boolean;
  repository: string;
  branch: string;
  summary: {
    totalFiles: number;
    totalFindings: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
  results: ScanResult[];
  scannedAt: string;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(dataParam));
        setScanData(decoded);
      } catch (error) {
        console.error('Failed to parse scan data:', error);
      }
    }
  }, [searchParams]);

  if (!scanData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Scan Results</h2>
          <p className="text-gray-400 mb-6">
            No scan results found. The results may have expired or the link is invalid.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            Scan a Repository
          </Link>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-emerald-400 hover:text-emerald-300 underline mb-4 inline-block"
          >
            ← Scan Another Repository
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Scan Results: <span className="text-emerald-400">{scanData.repository}</span>
          </h1>
          <p className="text-gray-400">
            Branch: {scanData.branch} • Scanned: {new Date(scanData.scannedAt).toLocaleString()}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">{scanData.summary.totalFindings}</div>
            <div className="text-sm text-gray-400">Total Findings</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <div className="text-2xl font-bold text-red-400">{scanData.summary.highSeverity}</div>
            <div className="text-sm text-gray-400">High Severity</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
            <div className="text-2xl font-bold text-yellow-400">{scanData.summary.mediumSeverity}</div>
            <div className="text-sm text-gray-400">Medium Severity</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-2xl font-bold text-white">{scanData.summary.totalFiles}</div>
            <div className="text-sm text-gray-400">Files with Issues</div>
          </div>
        </div>

        {/* CTA Banner */}
        {scanData.summary.totalFindings > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-2">
              ⚠️ Found {scanData.summary.totalFindings} potential secret{scanData.summary.totalFindings !== 1 ? 's' : ''}!
            </h3>
            <p className="text-gray-300 mb-4">
              Secure your secrets with APIVault. Store, rotate, and manage API keys securely—never commit them to GitHub again.
            </p>
            <a
              href="https://www.apivault.it.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Secure Your Secrets with APIVault →
            </a>
          </div>
        )}

        {/* Results */}
        {scanData.results.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Secrets Found!</h2>
            <p className="text-gray-400">
              Your repository appears to be clean. Great job keeping your secrets secure!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scanData.results.map((result) => (
              <div
                key={result.filePath}
                className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFile(expandedFile === result.filePath ? null : result.filePath)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="text-emerald-400 font-mono text-sm">{result.filePath}</div>
                    <div className="text-gray-400 text-sm">
                      {result.findings.length} finding{result.findings.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {expandedFile === result.filePath ? '▼' : '▶'}
                  </div>
                </button>

                {expandedFile === result.filePath && (
                  <div className="px-6 py-4 border-t border-gray-800 space-y-4">
                    {result.findings.map((finding, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-lg p-4 ${getSeverityColor(finding.severity)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">{finding.pattern}</div>
                          <div className="text-xs uppercase">{finding.severity}</div>
                        </div>
                        <div className="text-sm mb-2">
                          <span className="text-gray-400">Line {finding.line}:</span>{' '}
                          <code className="bg-gray-900/50 px-2 py-1 rounded">{finding.match}</code>
                        </div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                            Show context
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-950 rounded text-xs overflow-x-auto">
                            {finding.context}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}

