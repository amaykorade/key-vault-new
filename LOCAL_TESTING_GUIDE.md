# Local Payment Testing Guide

## Quick Start for Local Testing

### 1. Setup Test Credentials

1. Go to https://dashboard.razorpay.com/
2. **Switch to Test Mode** (toggle in top right corner)
3. Go to Settings → API Keys
4. Copy your **Test Key ID** (starts with `rzp_test_`)
5. Copy your **Test Key Secret**
6. Add to `Backend/.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_test_secret_here
   RAZORPAY_WEBHOOK_SECRET=test_webhook_secret_here  # Optional for local
   ```

### 2. Run Database Migration

```bash
cd Backend
npx prisma migrate dev --name add_subscription_model
# Or if migration already exists:
npx prisma migrate deploy
```

### 3. Start Services

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
# Should start on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Should start on http://localhost:5173
```

### 4. Test Payment Flow

1. Open http://localhost:5173/billing
2. Click "Subscribe Now" on the Starter plan
3. Select Monthly or Yearly billing
4. Payment modal opens with Razorpay checkout
5. Use test card: **4111 1111 1111 1111**
   - CVV: Any 3 digits (e.g., 123)
   - Expiry: Any future date (e.g., 12/25)
   - Name: Any name
6. Complete payment
7. Payment should verify and subscription should activate

### 5. Test Cards

| Card Number | Scenario |
|------------|----------|
| `4111 1111 1111 1111` | Successful payment |
| `4000 0000 0000 0002` | Payment failure |
| `4012 0010 3714 1112` | 3D Secure authentication |

**All test cards:**
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

### 6. Webhook Testing (Optional)

**Option 1: Skip Webhook (Simplest)**
- Payment verification happens immediately after payment
- Webhook is just a backup confirmation
- You can test without webhook setup

**Option 2: Use ngrok**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 4000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# In Razorpay Dashboard → Settings → Webhooks:
# Add: https://abc123.ngrok.io/api/payments/webhook
# Select events: payment.captured, payment.failed
# Copy webhook secret to .env
```

**Option 3: Manual Testing**
- Use Postman to send webhook payloads
- Or use Razorpay's webhook testing tool in dashboard

### 7. Verify It Works

After successful payment:
1. Check browser console for success message
2. Check backend logs for payment verification
3. Call `GET /api/payments/subscription` to see subscription status
4. Subscription should show:
   - `plan: "STARTER"`
   - `status: "ACTIVE"`
   - `billingCycle: "MONTHLY"` or `"YEARLY"`

### Troubleshooting

**Payment modal doesn't open:**
- Check browser console for errors
- Verify Razorpay script is loaded (check Network tab)
- Ensure `RAZORPAY_KEY_ID` is set correctly

**Payment verification fails:**
- Check backend logs for error messages
- Verify `RAZORPAY_KEY_SECRET` is correct
- Ensure you're using test credentials in test mode

**Webhook not working:**
- Webhook is optional for local testing
- Payment verification happens immediately, so webhook is just backup
- For full testing, use ngrok to expose local backend

**Database errors:**
- Ensure migration is applied: `npx prisma migrate deploy`
- Check database connection in `.env`
- Restart backend after migration

### Common Issues

1. **"Razorpay is not configured"**
   - Check `.env` file has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
   - Restart backend after adding credentials

2. **"Invalid payment signature"**
   - Usually means wrong `RAZORPAY_KEY_SECRET`
   - Double-check test credentials from dashboard

3. **"Subscription not found"**
   - Check if order was created in database
   - Verify migration was applied correctly

### Next Steps

Once local testing works:
1. Test with different test cards (success, failure, 3D Secure)
2. Test monthly vs yearly billing
3. Test subscription cancellation
4. Move to production with live credentials

