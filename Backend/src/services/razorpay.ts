import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../lib/db';

// Define types manually until Prisma client is fully regenerated
type SubscriptionPlan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';
type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE' | 'TRIALING';
type BillingCycle = 'MONTHLY' | 'YEARLY';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  console.warn('Razorpay credentials not configured. Payment features will be disabled.');
}

export const razorpay = razorpayKeyId && razorpayKeySecret
  ? new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })
  : null;

// Log Razorpay initialization (only in development)
if (process.env.NODE_ENV === 'development') {
  if (razorpay) {
    console.log('✅ Razorpay initialized');
  } else {
    console.warn('⚠️  Razorpay not initialized - check credentials');
  }
}

// Plan pricing in USD cents (1 USD = 100 cents)
const PLAN_PRICING: Record<SubscriptionPlan, { monthly: number; yearly: number }> = {
  FREE: { monthly: 0, yearly: 0 },
  STARTER: { monthly: 900, yearly: 7900 }, // $9/month = 900 cents, $79/year = 7900 cents
  PROFESSIONAL: { monthly: 1900, yearly: 19000 }, // $19/month = 1900 cents, $190/year = 19000 cents
  BUSINESS: { monthly: 7900, yearly: 79000 }, // $79/month = 7900 cents, $790/year = 79000 cents
};

export class RazorpayService {
  /**
   * Create a Razorpay order for a subscription plan
   */
  static async createOrder(
    userId: string,
    plan: SubscriptionPlan,
    billingCycle: BillingCycle
  ): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> {
    if (!razorpay) {
      throw new Error('Razorpay is not configured');
    }

    if (plan === 'FREE') {
      throw new Error('Cannot create order for FREE plan');
    }

    const amount = billingCycle === 'MONTHLY'
      ? PLAN_PRICING[plan].monthly
      : PLAN_PRICING[plan].yearly;

    // Get user details
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate a short receipt (max 40 chars for Razorpay)
    // Format: sub_<shortUserId>_<timestamp>
    // UUID is 36 chars, so we'll use first 8 chars of userId + timestamp
    const shortUserId = userId.substring(0, 8);
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const receipt = `sub_${shortUserId}_${timestamp}`; // Max: 4 + 8 + 1 + 8 = 21 chars
    
    const options = {
      amount: amount, // Amount in cents (USD)
      currency: 'USD',
      receipt: receipt,
      notes: {
        userId,
        plan,
        billingCycle,
        userEmail: user.email,
      },
    };

    try {
      console.log('Creating Razorpay order with options:', {
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        notes: options.notes,
      });
      
      const order = await razorpay.orders.create(options);
      
      console.log('Razorpay order created successfully:', {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      });

      // Store order in subscription record
      try {
        const existingSubscription = await db.subscription.findFirst({
          where: { userId },
        });
        
        if (existingSubscription) {
          // Update existing subscription
          await db.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              plan,
              billingCycle,
              razorpayOrderId: order.id,
              status: 'TRIALING',
            },
          });
        } else {
          // Create new subscription
          await db.subscription.create({
            data: {
              userId,
              plan,
              status: 'TRIALING',
              billingCycle,
              razorpayOrderId: order.id,
            },
          });
        }
      } catch (dbError: any) {
        console.error('Database error storing subscription:', dbError);
        console.error('Database error details:', {
          message: dbError.message,
          code: dbError.code,
          meta: dbError.meta,
          name: dbError.name,
        });
        
        // Check if it's a migration issue
        if (dbError.message?.includes('Unknown arg') || 
            dbError.message?.includes('does not exist') ||
            dbError.code === 'P2001' ||
            dbError.code === 'P2025') {
          throw new Error('Database migration not applied. Please run: npx prisma db push or npx prisma migrate dev');
        }
        
        // Re-throw database errors with more details
        const errorMsg = dbError.message || dbError.toString() || 'Failed to store subscription';
        throw new Error(`Database error: ${errorMsg}`);
      }

      return {
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        keyId: razorpayKeyId!,
      };
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Razorpay SDK errors are usually objects with statusCode and error properties
      if (error && typeof error === 'object') {
        // Check if it's a Razorpay API error
        if (error.statusCode) {
          const razorpayError = error;
          console.error('Razorpay API error:', {
            statusCode: razorpayError.statusCode,
            error: razorpayError.error,
            description: razorpayError.error?.description,
            message: razorpayError.message,
          });
          
          if (razorpayError.statusCode === 401) {
            throw new Error('Invalid Razorpay credentials. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
          } else if (razorpayError.statusCode === 400) {
            const description = razorpayError.error?.description || razorpayError.error?.field || razorpayError.message || 'Invalid request';
            throw new Error(`Invalid request to Razorpay: ${description}`);
          } else {
            const description = razorpayError.error?.description || razorpayError.message || 'Unknown Razorpay error';
            throw new Error(`Razorpay API error (${razorpayError.statusCode}): ${description}`);
          }
        }
        
        // Check if it's an Error instance
        if (error instanceof Error) {
          // Check for database errors
          if (error.message.includes('Unknown arg') || error.message.includes('does not exist')) {
            throw new Error('Database migration not applied. Please run: npx prisma migrate dev');
          }
          
          // Re-throw with original message
          throw error;
        }
        
        // If it's an object but not an Error, try to extract message
        if (error.message) {
          throw new Error(error.message);
        }
        
        if (error.error) {
          throw new Error(`Razorpay error: ${JSON.stringify(error.error)}`);
        }
      }
      
      // If error is a string
      if (typeof error === 'string') {
        throw new Error(error);
      }
      
      // Last resort - log everything
      console.error('Unknown error format:', error);
      throw new Error(`Failed to create payment order: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Verify payment signature
   */
  static verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    if (!razorpayKeySecret) {
      return false;
    }

    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(text)
      .digest('hex');

    return generatedSignature === signature;
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!razorpayWebhookSecret) {
      return false;
    }

    const generatedSignature = crypto
      .createHmac('sha256', razorpayWebhookSecret)
      .update(payload)
      .digest('hex');

    return generatedSignature === signature;
  }

  /**
   * Update subscription after successful payment
   */
  static async updateSubscriptionAfterPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<void> {
    // Verify signature
    if (!this.verifyPaymentSignature(orderId, paymentId, signature)) {
      throw new Error('Invalid payment signature');
    }

    // Find subscription by order ID
    const subscription = await db.subscription.findUnique({
      where: { razorpayOrderId: orderId },
      include: { user: true },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Calculate period dates
    const now = new Date();
    const periodStart = now;
    const periodEnd = new Date(now);
    
    if (subscription.billingCycle === 'MONTHLY') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Update subscription
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        razorpayPaymentId: paymentId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
      },
    });
  }

  /**
   * Handle Razorpay webhook events
   */
  static async handleWebhook(event: string, payload: any): Promise<void> {
    switch (event) {
      case 'payment.captured':
        // Payment was successfully captured
        if (payload.payment?.entity?.order_id) {
          const orderId = payload.payment.entity.order_id;
          const paymentId = payload.payment.entity.id;
          
          const subscription = await db.subscription.findUnique({
            where: { razorpayOrderId: orderId },
          });

          if (subscription) {
            const now = new Date();
            const periodEnd = new Date(now);
            
            if (subscription.billingCycle === 'MONTHLY') {
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            } else {
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            }

            await db.subscription.update({
              where: { id: subscription.id },
              data: {
                status: 'ACTIVE',
                razorpayPaymentId: paymentId,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
              },
            });
          }
        }
        break;

      case 'payment.failed':
        // Payment failed
        if (payload.payment?.entity?.order_id) {
          const orderId = payload.payment.entity.order_id;
          
          await db.subscription.updateMany({
            where: { razorpayOrderId: orderId },
            data: {
              status: 'PAST_DUE',
            },
          });
        }
        break;

      case 'subscription.cancelled':
        // Subscription was cancelled
        if (payload.subscription?.entity?.id) {
          const subscriptionId = payload.subscription.entity.id;
          
          await db.subscription.updateMany({
            where: { razorpaySubscriptionId: subscriptionId },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
            },
          });
        }
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string) {
    return db.subscription.findFirst({
      where: { userId },
    });
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string): Promise<void> {
    const subscription = await db.subscription.findFirst({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
    });
  }
}

