const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { notifyLineOrderSuccess } = require('./notifications');

const router = express.Router();

// POST /api/payments/create-payment-intent
router.post('/create-payment-intent', authenticate, async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) return res.status(400).json({ error: 'order_id is required' });

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (error || !order) return res.status(404).json({ error: 'Order not found' });
  if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (order.payment_status === 'paid') return res.status(400).json({ error: 'Order already paid' });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Stripe uses smallest currency unit (satang for THB)
      currency: 'thb',
      metadata: { order_id, user_id: req.user.id },
    });

    res.json({ client_secret: paymentIntent.client_secret, payment_intent_id: paymentIntent.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/create-qr — PromptPay QR via Stripe
router.post('/create-qr', authenticate, async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) return res.status(400).json({ error: 'order_id is required' });

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (error || !order) return res.status(404).json({ error: 'Order not found' });
  if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'thb',
      payment_method_types: ['promptpay'],
      metadata: { order_id, user_id: req.user.id },
    });

    const confirmResult = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: { type: 'promptpay' },
    });

    const qrCodeUrl = confirmResult.next_action?.promptpay_display_qr_code?.image_url_png;
    res.json({ qr_code_url: qrCodeUrl, payment_intent_id: paymentIntent.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/status/:paymentIntentId — poll payment status
router.get('/status/:paymentIntentId', authenticate, async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.paymentIntentId);
    res.json({ status: paymentIntent.status, amount: paymentIntent.amount / 100 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/webhook — Stripe webhook (raw body)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const { order_id } = event.data.object.metadata;
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed' })
      .eq('id', order_id);

    // Trigger Line OA notification
    await notifyLineOrderSuccess(order_id).catch(console.error);
  }

  if (event.type === 'payment_intent.payment_failed') {
    const { order_id } = event.data.object.metadata;
    await supabase
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', order_id);
  }

  res.json({ received: true });
});

module.exports = router;
