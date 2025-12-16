import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { db } from './db';
import { loadEnv } from '../config/env';

const env = loadEnv();

// Google OAuth Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback'
  }, async (accessToken: string, refreshToken: string | undefined, profile: any, done: (error: any, user?: any) => void) => {
    try {
      // Check if user already exists
      let user = await db.user.findUnique({
        where: { email: profile.emails?.[0]?.value },
        include: { accounts: true }
      });

      if (user) {
        // Check if Google account is already linked
        const existingAccount = user.accounts.find(acc => acc.provider === 'google');
        if (!existingAccount) {
          // Link Google account to existing user
          await db.account.create({
            data: {
              userId: user.id,
              type: 'oauth',
              provider: 'google',
              providerAccountId: profile.id,
              access_token: accessToken,
              refresh_token: refreshToken,
            }
          });
        }
        return done(null, user);
      }

      // Create new user with Google account
      user = await db.user.create({
        data: {
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName,
          image: profile.photos?.[0]?.value,
          emailVerifiedAt: new Date(),
          accounts: {
            create: {
              type: 'oauth',
              provider: 'google',
              providerAccountId: profile.id,
              access_token: accessToken,
              refresh_token: refreshToken,
            }
          }
        },
        include: { accounts: true }
      });

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
}

// GitHub OAuth Strategy
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use('github', new GitHubStrategy({
    clientID: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    callbackURL: env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/github/callback'
  }, async (accessToken: string, refreshToken: string | undefined, profile: any, done: (error: any, user?: any) => void) => {
    try {
      // GitHub profile may not have email in profile.emails
      // We'll use profile.username as fallback and try to get email from profile
      const email = profile.emails?.[0]?.value || `${profile.username}@users.noreply.github.com`;
      
      // Check if user already exists
      let user = await db.user.findUnique({
        where: { email },
        include: { accounts: true }
      });

      if (user) {
        // Check if GitHub account is already linked
        const existingAccount = user.accounts.find(acc => acc.provider === 'github');
        if (!existingAccount) {
          // Link GitHub account to existing user
          await db.account.create({
            data: {
              userId: user.id,
              type: 'oauth',
              provider: 'github',
              providerAccountId: profile.id,
              access_token: accessToken,
              refresh_token: refreshToken,
            }
          });
        }
        return done(null, user);
      }

      // Create new user with GitHub account
      user = await db.user.create({
        data: {
          email,
          name: profile.displayName || profile.username,
          image: profile.photos?.[0]?.value,
          emailVerifiedAt: new Date(),
          accounts: {
            create: {
              type: 'oauth',
              provider: 'github',
              providerAccountId: profile.id,
              access_token: accessToken,
              refresh_token: refreshToken,
            }
          }
        },
        include: { accounts: true }
      });

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }));
}

// JWT Strategy for protected routes
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.JWT_ACCESS_SECRET,
}, async (payload, done) => {
  try {
    if (payload.type !== 'access') {
      return done(null, false);
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      }
    });

    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));

export default passport;
