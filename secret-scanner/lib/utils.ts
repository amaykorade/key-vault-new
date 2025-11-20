/**
 * Utility functions for the secret scanner
 */

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Truncate string to max length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Get file extension from path
 */
export function getFileExtension(filePath: string): string {
  const parts = filePath.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Check if file is likely a code file
 */
export function isCodeFile(filePath: string): boolean {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb', '.php',
    '.cs', '.cpp', '.c', '.h', '.hpp', '.swift', '.kt', '.scala',
    '.rs', '.dart', '.vue', '.svelte', '.json', '.yaml', '.yml',
    '.toml', '.ini', '.conf', '.env', '.properties', '.xml', '.html',
    '.css', '.scss', '.sass', '.less', '.sh', '.bash', '.zsh', '.fish',
    '.ps1', '.bat', '.cmd', '.dockerfile', '.sql', '.md', '.txt',
  ];
  
  const ext = getFileExtension(filePath).toLowerCase();
  return codeExtensions.includes(ext);
}

