# Razorpay Payment Integration Setup Guide

## Overview
Razorpay payment integration has been implemented for subscription management. Users can subscribe to Starter, Professional, or Business plans with monthly or yearly billing.

## Backend Setup

### 1. Database Migration
Run the migration to create the Subscription table:

```bash
cd Backend
npx prisma migrate dev --name add_subscription_model
```

Or if you prefer to apply it manually, the migration file is at:
`Backend/prisma/migrations/20250101000000_add_subscription_model/migration.sql`

### 2. Environment Variables
Add the following to your `.env` file in the `Backend/` directory:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
```

### 3. Get Razorpay Credentials

1. **Sign up/Login to Razorpay Dashboard**: https://dashboard.razorpay.com/
2. **Get API Keys**:
   - Go to Settings → API Keys
   - Generate new API keys (or use existing ones)
   - Copy the **Key ID** and **Key Secret**
   - Add them to your `.env` file

3. **Set up Webhook** (For Production):
   - Go to Settings → Webhooks
   - Add a new webhook with URL: `https://www.api.apivault.it.com/api/payments/webhook`
   - Select events: `payment.captured`, `payment.failed`, `subscription.cancelled`
   - Copy the **Webhook Secret** and add it to your `.env` file
   - **Note**: For local testing, you can skip webhook setup or use ngrok (see Testing section)

## Frontend Setup

The Razorpay checkout script is already added to `frontend/index.html`. No additional setup needed.

## API Endpoints

### Create Payment Order
```
POST /api/payments/create-order
Body: { plan: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS', billingCycle: 'MONTHLY' | 'YEARLY' }
Response: { success: true, order: { id, amount, currency, keyId } }
```

### Verify Payment
```
POST /api/payments/verify-payment
Body: { orderId, paymentId, signature }
Response: { success: true, subscription }
```

### Get Subscription
```
GET /api/payments/subscription
Response: { success: true, subscription }
```

### Cancel Subscription
```
POST /api/payments/cancel-subscription
Response: { success: true, subscription }
```

### Webhook (Razorpay → Backend)
```
POST /api/payments/webhook
Headers: { 'x-razorpay-signature': signature }
Body: Raw JSON payload from Razorpay
```

## Pricing

Current pricing (in USD cents):
- **STARTER**: 
  - Monthly: $9 (900 cents)
  - Yearly: $79 (7900 cents)
- **PROFESSIONAL**: 
  - Monthly: $19 (1900 cents)
  - Yearly: $190 (19000 cents)
- **BUSINESS**: 
  - Monthly: $79 (7900 cents)
  - Yearly: $790 (79000 cents)

## Payment Flow

1. User clicks "Subscribe Now" on BillingPage
2. Frontend calls `/api/payments/create-order` with plan and billing cycle
3. Backend creates Razorpay order and stores it in Subscription table
4. Frontend opens Razorpay checkout modal
5. User completes payment on Razorpay
6. Razorpay redirects back with payment details
7. Frontend calls `/api/payments/verify-payment` to verify signature
8. Backend updates subscription status to ACTIVE
9. Webhook confirms payment (optional but recommended)

## Testing

### Local Testing (Development)

**Yes, payment testing works locally!** Here's how:

1. **Get Test Credentials**:
   - Login to Razorpay Dashboard: https://dashboard.razorpay.com/
   - Go to Settings → API Keys
   - Switch to **Test Mode** (toggle in top right)
   - Generate or copy your **Test Key ID** and **Test Key Secret**
   - Add them to your `Backend/.env`:
     ```env
     RAZORPAY_KEY_ID=rzp_test_xxxxx
     RAZORPAY_KEY_SECRET=your_test_secret
     RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret
     ```

2. **Test Payment Flow**:
   - Start your backend: `cd Backend && npm run dev`
   - Start your frontend: `cd frontend && npm run dev`
   - Navigate to `/billing` page
   - Click "Subscribe Now" on Starter plan
   - Use Razorpay test cards (see below)

3. **Test Cards** (Razorpay Test Mode):
   - **Success**: `4111 1111 1111 1111`
   - **Failure**: `4000 0000 0000 0002`
   - **3D Secure**: `4012 0010 3714 1112`
   - CVV: Any 3 digits
   - Expiry: Any future date
   - Name: Any name
   - More test cards: https://razorpay.com/docs/payments/test-cards/

4. **Webhook Testing (Local)**:
   
   **Option A: Use ngrok (Recommended for full testing)**
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 4000
   # Copy the https URL (e.g., https://abc123.ngrok.io)
   # Add webhook in Razorpay: https://abc123.ngrok.io/api/payments/webhook
   ```
   
   **Option B: Skip Webhook for Local Testing**
   - Payment will still work without webhook
   - Payment verification happens immediately after payment
   - Webhook is mainly for backup confirmation
   - You can test webhooks later in production
   
   **Option C: Manual Webhook Testing**
   - Use Razorpay's webhook testing tool in dashboard
   - Or use Postman to manually send webhook payloads to `http://localhost:4000/api/payments/webhook`

5. **Local Testing Checklist**:
   - ✅ Backend running on `http://localhost:4000`
   - ✅ Frontend running on `http://localhost:5173`
   - ✅ Test API keys in `.env`
   - ✅ Database migration applied
   - ✅ Try payment with test card
   - ✅ Verify subscription status updates

### Production Testing
- Use live API keys from Razorpay dashboard
- Ensure webhook URL is publicly accessible: `https://www.api.apivault.it.com/api/payments/webhook`
- Test webhook signature verification
- Use real payment methods (small amounts recommended)

## Important Notes

1. **Webhook Secret**: Must be set correctly for webhook signature verification
2. **Currency**: Currently set to USD. Amounts are in cents (1 USD = 100 cents)
3. **Pricing**: Update `PLAN_PRICING` in `Backend/src/services/razorpay.ts` to adjust prices (in cents)
4. **Webhook URL**: Update the webhook URL in Razorpay dashboard to match your production backend URL
5. **Razorpay Account**: Ensure your Razorpay account supports USD currency

## Next Steps

1. ✅ Add Razorpay credentials to environment variables
2. ✅ Run database migration
3. ✅ Test payment flow in test mode
4. ✅ Configure webhook in Razorpay dashboard
5. ✅ Test webhook with Razorpay's webhook testing tool
6. ✅ Switch to production keys when ready

