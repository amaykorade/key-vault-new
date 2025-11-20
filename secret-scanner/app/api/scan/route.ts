import { NextRequest, NextResponse } from 'next/server';
import { scanGitHubRepo, parseGitHubUrl } from '@/lib/github';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { z } from 'zod';

const scanSchema = z.object({
  url: z.string().url().or(z.string().regex(/^[^\/]+\/[^\/]+$/)), // URL or owner/repo format
  branch: z.string().optional(),
  accessToken: z.string().optional(),
});

// Maximum scan duration (120 seconds - increased for larger repos with parallel scanning)
const MAX_SCAN_DURATION_MS = 120 * 1000;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting (more lenient to avoid conflicts with GitHub API limits)
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP, {
      maxRequests: 20, // 20 scans per hour (increased from 10)
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have exceeded the rate limit of 20 scans per hour. Please try again later.`,
          resetAt: new Date(rateLimit.resetAt).toISOString(),
          type: 'scanner_rate_limit',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();
    const validated = scanSchema.parse(body);

    // Parse GitHub URL
    const parsed = parseGitHubUrl(validated.url);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL. Use format: github.com/owner/repo or owner/repo' },
        { status: 400 }
      );
    }

    // Validate repository name format
    if (!/^[a-zA-Z0-9._-]+$/.test(parsed.owner) || !/^[a-zA-Z0-9._-]+$/.test(parsed.repo)) {
      return NextResponse.json(
        { error: 'Invalid repository owner or name format' },
        { status: 400 }
      );
    }

    // Set timeout for scan operation
    const scanPromise = scanGitHubRepo({
      owner: parsed.owner,
      repo: parsed.repo,
      branch: validated.branch,
      accessToken: validated.accessToken,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Scan timeout: Repository is too large or scan took too long'));
      }, MAX_SCAN_DURATION_MS);
    });

    // Scan the repository with timeout
    const results = await Promise.race([scanPromise, timeoutPromise]);

    // Calculate summary
    const summary = {
      totalFiles: results.length,
      totalFindings: results.reduce((sum, r) => sum + r.findings.length, 0),
      highSeverity: results.reduce((sum, r) => sum + r.findings.filter((f) => f.severity === 'high').length, 0),
      mediumSeverity: results.reduce((sum, r) => sum + r.findings.filter((f) => f.severity === 'medium').length, 0),
      lowSeverity: results.reduce((sum, r) => sum + r.findings.filter((f) => f.severity === 'low').length, 0),
    };

    const scanDuration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        repository: `${parsed.owner}/${parsed.repo}`,
        branch: validated.branch || 'main',
        summary,
        results,
        scannedAt: new Date().toISOString(),
        scanDurationMs: scanDuration,
      },
      {
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Scan error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Scan timeout',
            message: 'The repository scan took longer than 90 seconds. This usually happens with very large repositories (>150 files). Try scanning a specific branch or a smaller repository.',
            suggestion: 'For large repositories, consider scanning specific folders or branches, or use a tool like TruffleHog for comprehensive scanning.',
          },
          { status: 408 }
        );
      }

      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json(
          {
            error: 'Repository not found',
            message: 'The repository does not exist or is not accessible. Make sure it is a public repository.',
          },
          { status: 404 }
        );
      }

      if (error.message.includes('rate limit') || error.message.includes('403') || error.message.includes('Rate limit')) {
        return NextResponse.json(
          {
            error: 'GitHub API rate limit exceeded',
            message: error.message || 'GitHub API rate limit has been exceeded. Please try again later. Consider connecting your GitHub account for higher rate limits (5000/hour vs 60/hour).',
            type: 'github_rate_limit',
          },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to scan repository',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

