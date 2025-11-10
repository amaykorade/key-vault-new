import crypto from 'crypto';
import { db } from '../lib/db';

const CLI_TOKEN_PREFIX = 'kv_cli_';

function generateCliToken(): string {
  return `${CLI_TOKEN_PREFIX}${crypto.randomBytes(24).toString('hex')}`;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class CliTokenService {
  static async createToken(userId: string, name?: string) {
    const token = generateCliToken();
    const tokenHash = hashToken(token);

    const record = await db.cliToken.create({
      data: {
        userId,
        name,
        tokenHash,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return { token, record };
  }

  static async listTokens(userId: string) {
    return db.cliToken.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async deleteToken(userId: string, tokenId: string) {
    const token = await db.cliToken.findFirst({
      where: { id: tokenId, userId },
    });

    if (!token) {
      return false;
    }

    await db.cliToken.delete({ where: { id: tokenId } });
    return true;
  }

  static hash(token: string) {
    return hashToken(token);
  }
}

