import { Octokit } from '@octokit/rest';
import { scanFileContent } from './patterns';

/**
 * Check if error is a GitHub rate limit error
 */
export function isRateLimitError(error: any): boolean {
  if (error?.status === 403) {
    const rateLimitRemaining = error?.response?.headers?.['x-ratelimit-remaining'];
    const rateLimitReset = error?.response?.headers?.['x-ratelimit-reset'];
    return rateLimitRemaining === '0' || !!rateLimitReset;
  }
  return false;
}

/**
 * Get rate limit info from error
 */
export function getRateLimitInfo(error: any): { remaining: number; resetAt: Date | null } {
  const remaining = parseInt(error?.response?.headers?.['x-ratelimit-remaining'] || '0', 10);
  const resetTimestamp = parseInt(error?.response?.headers?.['x-ratelimit-reset'] || '0', 10);
  const resetAt = resetTimestamp > 0 ? new Date(resetTimestamp * 1000) : null;
  
  return { remaining, resetAt };
}

export interface ScanResult {
  filePath: string;
  findings: Array<{
    pattern: string;
    severity: 'high' | 'medium' | 'low';
    match: string;
    line: number;
    context: string;
  }>;
}

export interface GitHubScanOptions {
  owner: string;
  repo: string;
  branch?: string;
  accessToken?: string;
}

/**
 * Fetch repository tree from GitHub
 */
async function getRepoTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<string[]> {
  try {
    // Get the branch SHA
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const sha = refData.object.sha;

    // Get the tree recursively
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: sha,
      recursive: 'true',
    });

    // Filter for files only (not directories)
    return treeData.tree
      .filter((item) => item.type === 'blob')
      .map((item) => item.path || '');
  } catch (error: any) {
    console.error('Error fetching repo tree:', error);
    
    // Check for rate limit
    if (isRateLimitError(error)) {
      const { resetAt } = getRateLimitInfo(error);
      const resetTime = resetAt ? resetAt.toLocaleString() : 'later';
      throw new Error(`GitHub API rate limit exceeded. Please try again after ${resetTime}. Consider connecting your GitHub account for higher rate limits (5000/hour vs 60/hour).`);
    }
    
    if (error?.status === 404) {
      throw new Error('Repository not found or not accessible');
    }
    
    throw new Error(`Failed to fetch repository tree: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Fetch file content from GitHub
 */
async function getFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<string> {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if ('content' in data && data.content) {
      // Decode base64 content
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    throw new Error('File content not found');
  } catch (error: any) {
    // Skip rate limit errors for individual files (we'll catch it at the repo level)
    if (isRateLimitError(error)) {
      throw error; // Re-throw to be handled at higher level
    }
    
    // Skip 404s for individual files (file might not exist)
    if (error?.status === 404) {
      throw error; // Re-throw to skip this file
    }
    
    console.error(`Error fetching file ${path}:`, error);
    // Don't throw for individual file errors, just skip them
    throw new Error(`Skipping file ${path}`);
  }
}

/**
 * Check if file should be scanned (exclude binary, large files, etc.)
 */
function shouldScanFile(filePath: string, size?: number): boolean {
  // Skip binary files
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.pdf', '.zip', '.tar', '.gz'];
  if (binaryExtensions.some((ext) => filePath.toLowerCase().endsWith(ext))) {
    return false;
  }

  // Skip large files (> 1MB)
  if (size && size > 1024 * 1024) {
    return false;
  }

  // Skip common non-code files
  const skipPatterns = [
    '/node_modules/',
    '/.git/',
    '/dist/',
    '/build/',
    '/.next/',
    '/coverage/',
    'package-lock.json',
    'yarn.lock',
    '.min.js',
    '.min.css',
  ];

  if (skipPatterns.some((pattern) => filePath.includes(pattern))) {
    return false;
  }

  return true;
}

/**
 * Scan a GitHub repository for secrets
 */
export async function scanGitHubRepo(
  options: GitHubScanOptions
): Promise<ScanResult[]> {
  const { owner, repo, branch = 'main', accessToken } = options;

  // Initialize Octokit
  const octokit = new Octokit({
    auth: accessToken,
  });

  try {
    // Verify repository access
    await octokit.repos.get({ owner, repo });
  } catch (error: any) {
    // Check for rate limit
    if (isRateLimitError(error)) {
      const { resetAt } = getRateLimitInfo(error);
      const resetTime = resetAt ? resetAt.toLocaleString() : 'later';
      throw new Error(`GitHub API rate limit exceeded. Please try again after ${resetTime}. Consider connecting your GitHub account for higher rate limits (5000/hour vs 60/hour).`);
    }
    
    if (error?.status === 404) {
      throw new Error('Repository not found or not accessible');
    }
    
    if (error?.status === 403) {
      throw new Error('Access denied. Repository may be private or rate limit exceeded. Try connecting your GitHub account.');
    }
    
    throw new Error(`Failed to access repository: ${error?.message || 'Unknown error'}`);
  }

  // Get all files in the repository
  const filePaths = await getRepoTree(octokit, owner, repo, branch);

  // Filter files to scan
  const filesToScan = filePaths.filter((path) => shouldScanFile(path));

  // Prioritize important files (config files, env files, etc.) that are more likely to contain secrets
  const priorityFiles = filesToScan.filter(path => 
    path.includes('.env') || 
    path.includes('config') || 
    path.includes('secret') || 
    path.includes('key') ||
    path.includes('credential') ||
    path.includes('password') ||
    path.endsWith('.json') ||
    path.endsWith('.yaml') ||
    path.endsWith('.yml') ||
    path.endsWith('.toml') ||
    path.endsWith('.ini')
  );
  
  // Get other files
  const otherFiles = filesToScan.filter(path => !priorityFiles.includes(path));
  
  // Combine: priority files first, then others (limit to 200 total)
  const limitedFiles = [...priorityFiles, ...otherFiles].slice(0, 200);
  
  console.log(`[Scan] Found ${filePaths.length} total files, ${filesToScan.length} scannable (${priorityFiles.length} priority), scanning ${limitedFiles.length} files`);

  const results: ScanResult[] = [];

  // Scan files in parallel batches for better performance
  const BATCH_SIZE = 10; // Process 10 files in parallel
  const totalFiles = limitedFiles.length;
  
  console.log(`[Scan] Starting parallel scan of ${totalFiles} files in batches of ${BATCH_SIZE}`);
  
  // Process files in batches
  for (let i = 0; i < limitedFiles.length; i += BATCH_SIZE) {
    const batch = limitedFiles.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalFiles / BATCH_SIZE);
    
    console.log(`[Scan] Processing batch ${batchNumber}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, totalFiles)} of ${totalFiles})`);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (filePath) => {
      try {
        const content = await getFileContent(octokit, owner, repo, filePath, branch);
        const findings = scanFileContent(content, filePath);

        if (findings.length > 0) {
          return {
            filePath,
            findings: findings.map((f) => ({
              pattern: f.pattern.name,
              severity: f.pattern.severity,
              match: f.match.substring(0, 50) + (f.match.length > 50 ? '...' : ''), // Truncate match
              line: f.line,
              context: f.context,
            })),
          };
        }
        return null;
      } catch (error: any) {
        // Check for rate limit error - re-throw to stop scanning
        if (isRateLimitError(error)) {
          throw error;
        }
        
        // Skip files that can't be read (binary, 404, etc.)
        if (error?.message?.includes('Skipping file')) {
          return null;
        }
        
        // Silently skip other errors
        return null;
      }
    });
    
    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Add non-null results
    batchResults.forEach(result => {
      if (result) {
        results.push(result);
      }
    });
    
    // Small delay between batches to avoid rate limits (reduced since we're batching)
    if (i + BATCH_SIZE < limitedFiles.length) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  
  console.log(`[Scan] Completed: ${results.length} files with findings out of ${totalFiles} scanned`);

  return results;
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Match patterns like:
  // https://github.com/owner/repo
  // github.com/owner/repo
  // owner/repo
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/\?#]+)/,
    /^([^\/]+)\/([^\/\?#]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''), // Remove .git suffix if present
      };
    }
  }

  return null;
}

