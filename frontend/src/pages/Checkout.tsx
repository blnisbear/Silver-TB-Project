import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import Swal from 'sweetalert2';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

// The actual payment form child component
const CheckoutForm = ({ clientSecret, orderId, amount }: { clientSecret: string, orderId: string, amount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Change to your actual success URL in production
        return_url: `${window.location.origin}/checkout?success=true`,
      },
      redirect: 'if_required'
    });

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: error.message || 'Something went wrong with the payment.'
      });
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      clearCart();
      Swal.fire({
        icon: 'success',
        title: 'Payment Successful!',
        text: 'Thank you for your purchase.'
      });
      navigate('/');
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        disabled={isProcessing || !stripe || !elements}
        className="w-full py-3.5 bg-orange-gradient text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : `Pay ฿${amount.toLocaleString()}`}
      </button>
    </form>
  );
};

const Checkout = () => {
  const { items, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [address, setAddress] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    }
    if (items.length === 0) {
      navigate('/products');
    }
  }, [user, items, navigate]);

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      Swal.fire({ icon: 'warning', title: 'Address Required', text: 'Please enter your shipping address.' });
      return;
    }

    setIsCreatingOrder(true);
    try {
      // 1. Create Order
      const orderData = await api.post<any>('/orders', {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: address
      });

      setOrderId(orderData.id);

      // 2. Create Payment Intent
      const paymentData = await api.post<any>('/payments/create-payment-intent', {
        order_id: orderData.id
      });

      setClientSecret(paymentData.client_secret);
      setStep(2);
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Setup Failed',
        text: error.message || 'Could not initialize payment.'
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (!user || items.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Checkout</h1>
      
      {/* Steps Indicator */}
      <div className="flex items-center justify-center mb-10">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-orange font-bold' : 'text-gray-400'}`}>
          <MapPin className="w-5 h-5" />
          <span>Shipping</span>
        </div>
        <div className="w-16 h-px bg-gray-300 mx-4"></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-orange font-bold' : 'text-gray-400'}`}>
          <CreditCard className="w-5 h-5" />
          <span>Payment</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-xl font-bold mb-6 text-gray-800">1. Shipping Details</h2>
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Shipping Address</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Example Street, Bangkok 10110..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/50 transition-shadow min-h-[120px]"
                />
              </div>

              {/* Order Summary snippet */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Order Summary</h3>
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={item.product_id} className="flex justify-between text-sm text-gray-600">
                      <span>{item.quantity}x {item.name}</span>
                      <span>฿{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-2">
                  <span>Total</span>
                  <span>฿{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingOrder}
                className="w-full py-3.5 bg-orange-gradient text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isCreatingOrder ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && clientSecret && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-xl font-bold mb-6 text-gray-800">2. Payment</h2>
            <div className="mb-6 p-4 bg-orange/10 text-orange-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-orange" />
              <p className="text-sm">
                You are paying <strong>฿{totalPrice.toLocaleString()}</strong>. Please do not close this window during the transaction.
              </p>
            </div>

            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: { theme: 'stripe', variables: { colorPrimary: '#f97316' } } 
              }}
            >
              <CheckoutForm clientSecret={clientSecret} orderId={orderId} amount={totalPrice} />
            </Elements>

            <button
              onClick={() => setStep(1)}
              className="mt-6 text-center w-full text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              ← Back to Shipping
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
