import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  plan: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';
  billingCycle: 'MONTHLY' | 'YEARLY';
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ plan, billingCycle, onClose, onSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Razorpay is loaded
    if (window.Razorpay) {
      setIsLoading(false);
    } else {
      // Wait for Razorpay to load
      const checkRazorpay = setInterval(() => {
        if (window.Razorpay) {
          setIsLoading(false);
          clearInterval(checkRazorpay);
        }
      }, 100);

      return () => clearInterval(checkRazorpay);
    }
  }, []);

  const handlePayment = async () => {
    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading('Creating payment order...');

    try {
      // Create order
      const { order } = await apiService.createPaymentOrder(plan, billingCycle);

      // Initialize Razorpay checkout
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'APIVault',
        description: `${plan} Plan - ${billingCycle}`,
        order_id: order.id,
        handler: async function (response: any) {
          toast.dismiss(loadingToast);
          const verifyToast = toast.loading('Verifying payment...');

          try {
            // Verify payment
            await apiService.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            toast.dismiss(verifyToast);
            toast.success('Payment successful! Your subscription is now active.');
            onSuccess();
            onClose();
          } catch (error: any) {
            toast.dismiss(verifyToast);
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          // You can prefill user details if available
        },
        theme: {
          color: '#10b981', // Emerald color
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast.dismiss(loadingToast);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      toast.dismiss(loadingToast);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Payment order creation error:', error);
      toast.error(error.message || 'Failed to create payment order. Please try again.');
      setIsProcessing(false);
    }
  };

  const planNames: Record<string, string> = {
    STARTER: 'Starter',
    PROFESSIONAL: 'Professional',
    BUSINESS: 'Business',
  };

  const prices: Record<string, { monthly: string; yearly: string }> = {
    STARTER: { monthly: '$9', yearly: '$79' },
    PROFESSIONAL: { monthly: '$19', yearly: '$190' },
    BUSINESS: { monthly: '$79', yearly: '$790' },
  };

  const price = billingCycle === 'MONTHLY' ? prices[plan].monthly : prices[plan].yearly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md border-gray-800 bg-gray-900/95">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Complete Payment</CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isProcessing}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Plan</span>
              <span className="text-white font-medium">{planNames[plan]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Billing Cycle</span>
              <span className="text-white font-medium">{billingCycle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Amount</span>
              <span className="text-emerald-400 font-bold text-lg">{price}</span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-blue-300 text-xs">
              You will be redirected to Razorpay's secure payment gateway to complete the transaction.
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing || isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handlePayment}
              disabled={isProcessing || isLoading}
              loading={isProcessing || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Loading...' : isProcessing ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

