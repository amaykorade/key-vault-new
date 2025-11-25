import { Router } from 'express';
import express from 'express';
import { requireAuth } from '../middleware/auth';
import { RazorpayService } from '../services/razorpay';
import { z } from 'zod';
import { db } from '../lib/db';

const router = Router();

// Create payment order
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const schema = z.object({
      plan: z.enum(['STARTER', 'PROFESSIONAL', 'BUSINESS']),
      billingCycle: z.enum(['MONTHLY', 'YEARLY']),
    });

    const { plan, billingCycle } = schema.parse(req.body);

    const order = await RazorpayService.createOrder(userId, plan, billingCycle);

    res.json({
      success: true,
      order: {
        id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to create payment order';
    let statusCode = 400;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes('Razorpay is not configured')) {
        errorMessage = 'Payment gateway not configured. Please contact support.';
        statusCode = 500;
      } else if (error.message.includes('User not found')) {
        errorMessage = 'User not found. Please try logging in again.';
        statusCode = 401;
      } else if (error.message.includes('Cannot create order for FREE plan')) {
        errorMessage = 'Cannot create payment order for free plan.';
        statusCode = 400;
      } else if (error.message.includes('Prisma') || error.message.includes('database')) {
        errorMessage = 'Database error. Please check if migration has been run.';
        statusCode = 500;
      }
    }
    
    // Log full error details for debugging
    console.error('Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    
    res.status(statusCode).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' && error instanceof Error 
        ? error.stack 
        : undefined,
    });
  }
});

// Verify payment
router.post('/verify-payment', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const schema = z.object({
      orderId: z.string(),
      paymentId: z.string(),
      signature: z.string(),
    });

    const { orderId, paymentId, signature } = schema.parse(req.body);

    // Verify payment signature
    const isValid = RazorpayService.verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update subscription
    await RazorpayService.updateSubscriptionAfterPayment(orderId, paymentId, signature);

    // Get updated subscription
    const subscription = await RazorpayService.getUserSubscription(userId);

    res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to verify payment',
    });
  }
});

// Get current subscription
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    let subscription = await RazorpayService.getUserSubscription(userId);

    // Create FREE subscription if none exists
    if (!subscription) {
      subscription = await db.subscription.create({
        data: {
          userId,
          plan: 'FREE',
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
        },
      });
    }

    res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      error: 'Failed to get subscription',
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    await RazorpayService.cancelSubscription(userId);

    const subscription = await RazorpayService.getUserSubscription(userId);

    res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    });
  }
});

// Razorpay webhook handler (raw body middleware applied in app.ts)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    
    // Get raw body (should be Buffer if middleware is set up correctly)
    const rawBody = req.body instanceof Buffer 
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);
    
    const payload = typeof req.body === 'object' && !(req.body instanceof Buffer)
      ? req.body
      : JSON.parse(rawBody);

    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature using raw body
    const isValid = RazorpayService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = payload.event;
    await RazorpayService.handleWebhook(event, payload);

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      error: 'Webhook processing failed',
    });
  }
});

export default router;

