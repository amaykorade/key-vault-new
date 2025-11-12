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
  try {
    const payload = earlyAccessSchema.parse(req.body);

    const existing = await db.earlyAccessSignup.findFirst({
      where: { email: payload.email },
    });

    if (existing) {
      await db.earlyAccessSignup.update({
        where: { id: existing.id },
        data: {
          name: payload.name,
          developerType: payload.developerType,
        },
      });
    } else {
      await db.earlyAccessSignup.create({
        data: {
          email: payload.email,
          name: payload.name,
          developerType: payload.developerType,
        },
      });
    }

    try {
      await EmailService.sendEarlyAccessConfirmation(
        payload.email,
        payload.name,
        payload.developerType
      );
    } catch (emailError) {
      console.error('[public] early access email error:', emailError instanceof Error ? emailError.message : emailError);
    }

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.flatten() });
    }

    console.error('[public] early access signup failed', error);
    res.status(500).json({ success: false, error: 'Failed to submit early access request' });
  }
});

export default router;
