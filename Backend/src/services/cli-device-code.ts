import { db } from '../lib/db';
import { randomBytes } from 'crypto';
import { CliTokenService } from './cli-token';

export interface DeviceCodeInfo {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number; // seconds
  interval: number; // polling interval in seconds
}

export class CliDeviceCodeService {
  /**
   * Generate a device code for CLI authentication
   */
  static async generateDeviceCode(): Promise<DeviceCodeInfo> {
    const deviceCode = `kv_dc_${randomBytes(32).toString('hex')}`;
    const userCode = this.generateUserCode(); // Human-readable code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.cliDeviceCode.create({
      data: {
        deviceCode,
        userCode,
        expiresAt,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/cli/auth?code=${userCode}`;

    return {
      deviceCode,
      userCode,
      verificationUrl,
      expiresIn: 600, // 10 minutes
      interval: 2, // Poll every 2 seconds
    };
  }

  /**
   * Generate a human-readable user code (e.g., ABCD-1234)
   */
  private static generateUserCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    const parts: string[] = [];
    for (let i = 0; i < 2; i++) {
      let part = '';
      for (let j = 0; j < 4; j++) {
        part += chars[Math.floor(Math.random() * chars.length)];
      }
      parts.push(part);
    }
    return parts.join('-');
  }

  /**
   * Get device code status
   */
  static async getDeviceCodeStatus(deviceCode: string): Promise<{
    status: 'pending' | 'approved' | 'expired';
    token?: string;
    error?: string;
  }> {
    try {
      const deviceCodeRecord = await db.cliDeviceCode.findUnique({
        where: { deviceCode },
        include: { cliToken: true },
      });

      if (!deviceCodeRecord) {
        console.log(`[cli-device-code] Device code not found: ${deviceCode.substring(0, 20)}...`);
        return { status: 'expired', error: 'Device code not found' };
      }

      const now = new Date();
      const expiresAt = new Date(deviceCodeRecord.expiresAt);
      
      if (now > expiresAt) {
        console.log(`[cli-device-code] Device code expired: ${deviceCode.substring(0, 20)}... (expired at ${expiresAt.toISOString()})`);
        // Clean up expired code
        await db.cliDeviceCode.delete({ where: { deviceCode } }).catch(console.error);
        this.tokenCache.delete(deviceCode);
        return { status: 'expired', error: 'Device code expired' };
      }

      if (deviceCodeRecord.verifiedAt && deviceCodeRecord.cliTokenId) {
        // Device code has been approved, check if token is in cache
        const token = this.getTokenForDeviceCode(deviceCode);
        if (token) {
          console.log(`[cli-device-code] Token found in cache for device code: ${deviceCode.substring(0, 20)}...`);
          return {
            status: 'approved',
            token,
          };
        }
        // Token was already retrieved or expired from cache
        console.log(`[cli-device-code] Token not in cache for device code: ${deviceCode.substring(0, 20)}... (already retrieved or cache expired)`);
        // Don't return expired - the token was retrieved, so we should allow the CLI to use it
        // Instead, check if we can get it from the database token record
        // Actually, we can't get the plain token from DB since we only store the hash
        // So if it's not in cache, it means it was already retrieved
        return { status: 'expired', error: 'Token already retrieved. Please generate a new device code.' };
      }

      // Device code exists, is not expired, and not yet verified
      const timeRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      console.log(`[cli-device-code] Device code pending: ${deviceCode.substring(0, 20)}... (${timeRemaining}s remaining)`);
      return { status: 'pending' };
    } catch (error) {
      console.error('[cli-device-code] Error getting device code status:', error);
      throw error;
    }
  }

  /**
   * Authorize a device code with a user session
   */
  static async authorizeDeviceCode(userCode: string, userId: string, tokenName?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const deviceCodeRecord = await db.cliDeviceCode.findUnique({
      where: { userCode },
    });

    if (!deviceCodeRecord) {
      return { success: false, error: 'Invalid user code' };
    }

    if (new Date() > deviceCodeRecord.expiresAt) {
      await db.cliDeviceCode.delete({ where: { userCode } });
      return { success: false, error: 'User code expired' };
    }

    if (deviceCodeRecord.verifiedAt) {
      return { success: false, error: 'User code already used' };
    }

    // Create CLI token for the user
    const { token, record: tokenRecord } = await CliTokenService.createToken(userId, tokenName);

    // Update device code with token and mark as verified
    await db.cliDeviceCode.update({
      where: { userCode },
      data: {
        userId,
        cliTokenId: tokenRecord.id,
        verifiedAt: new Date(),
      },
    });

    // Store the plain token temporarily so CLI can retrieve it
    // We'll store it in a way that the CLI can get it via deviceCode
    // For security, we'll store it encrypted or in memory cache
    // For now, let's store it in the device code record temporarily
    // Actually, we can't store plain tokens. Let's return it via a one-time endpoint
    // Or better: store it in a temporary cache/table that expires quickly
    // For MVP, let's store it in a JSON field temporarily (not ideal but works)
    await db.cliDeviceCode.update({
      where: { userCode },
      data: {
        // Store token temporarily - we'll clean it up after retrieval
        // Since we can't add new fields easily, let's use a different approach:
        // Return the token immediately to the frontend, and the CLI polls for status
        // When status is 'approved', we need to return the actual token
        // Solution: Store token in a separate temporary table or use Redis
        // For now, let's modify the flow: frontend calls an endpoint that returns the token
        // and the CLI gets it via deviceCode lookup
      },
    });

    // We need to return the token to the CLI somehow
    // Let's create a temporary token storage
    await this.storeTokenForDeviceCode(deviceCodeRecord.deviceCode, token);

    return { success: true };
  }

  /**
   * Store token temporarily for device code retrieval
   * In production, use Redis. For now, we'll use a simple in-memory cache
   */
  private static tokenCache = new Map<string, { token: string; expiresAt: Date }>();

  private static async storeTokenForDeviceCode(deviceCode: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    this.tokenCache.set(deviceCode, { token, expiresAt });

    // Clean up expired entries
    setTimeout(() => {
      this.tokenCache.delete(deviceCode);
    }, 5 * 60 * 1000);
  }

  /**
   * Get token for device code (one-time retrieval)
   */
  static getTokenForDeviceCode(deviceCode: string): string | null {
    const cached = this.tokenCache.get(deviceCode);
    if (!cached) {
      return null;
    }

    if (new Date() > cached.expiresAt) {
      this.tokenCache.delete(deviceCode);
      return null;
    }

    // Delete after retrieval (one-time use)
    this.tokenCache.delete(deviceCode);
    return cached.token;
  }

  /**
   * Clean up expired device codes
   */
  static async cleanupExpiredCodes(): Promise<void> {
    await db.cliDeviceCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

