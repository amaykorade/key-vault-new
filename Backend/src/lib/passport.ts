import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
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
  }, async (accessToken, refreshToken, profile, done) => {
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
