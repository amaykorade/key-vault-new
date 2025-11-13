import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/db';
import { EmailService } from '../services/email';

const router = Router();

const earlyAccessSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
  developerType: z.enum(['solo', 'freelance', 'team']),
});

router.post('/early-access', async (req, res) => {
  // Set a timeout for this request
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('[public] Early access request timeout');
      res.status(504).json({ success: false, error: 'Request timeout' });
    }
  }, 30000); // 30 second timeout

  try {
    console.log('[public] Early access signup request received:', { 
      body: req.body,
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']
    });
    const payload = earlyAccessSchema.parse(req.body);
    console.log('[public] Validated payload:', { email: payload.email, developerType: payload.developerType });

    const existing = await db.earlyAccessSignup.findFirst({
      where: { email: payload.email },
    });

    if (existing) {
      console.log('[public] Updating existing signup:', existing.id);
      await db.earlyAccessSignup.update({
        where: { id: existing.id },
        data: {
          name: payload.name,
          developerType: payload.developerType,
        },
      });
    } else {
      console.log('[public] Creating new signup');
      await db.earlyAccessSignup.create({
        data: {
          email: payload.email,
          name: payload.name,
          developerType: payload.developerType,
        },
      });
    }

    try {
      console.log('[public] Sending confirmation email to:', payload.email);
      await EmailService.sendEarlyAccessConfirmation(
        payload.email,
        payload.name,
        payload.developerType
      );
      console.log('[public] Confirmation email sent successfully');
    } catch (emailError) {
      console.error('[public] early access email error:', emailError instanceof Error ? emailError.message : emailError);
    }

    console.log('[public] Early access signup completed successfully');
    clearTimeout(timeout);
    res.json({ success: true });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof z.ZodError) {
      console.error('[public] Validation error:', error.flatten());
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.flatten() });
    }

    console.error('[public] early access signup failed', error);
    res.status(500).json({ success: false, error: 'Failed to submit early access request' });
  }
});

export default router;
