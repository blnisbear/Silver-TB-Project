const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders — create order
router.post('/', authenticate, async (req, res) => {
  const { items, shipping_address } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }

  // Fetch product prices from DB to prevent price tampering
  const productIds = items.map((i) => i.product_id);
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, price, stock, name')
    .in('id', productIds);

  if (prodError) return res.status(500).json({ error: prodError.message });

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  // Validate stock and calculate total
  let total = 0;
  const orderItems = [];
  for (const item of items) {
    const product = productMap[item.product_id];
    if (!product) return res.status(400).json({ error: `Product ${item.product_id} not found` });
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
    }
    total += product.price * item.quantity;
    orderItems.push({ product_id: item.product_id, quantity: item.quantity, price: product.price, name: product.name });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: req.user.id,
      items: orderItems,
      total,
      shipping_address: shipping_address || null,
      status: 'pending',
      payment_status: 'unpaid',
    })
    .select()
    .single();

  if (orderError) return res.status(500).json({ error: orderError.message });

  // Decrement stock
  for (const item of items) {
    const product = productMap[item.product_id];
    await supabase
      .from('products')
      .update({ stock: product.stock - item.quantity })
      .eq('id', item.product_id);
  }

  res.status(201).json(order);
});

// GET /api/orders — current user's orders
router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Order not found' });
  if (data.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(data);
});

// PATCH /api/orders/:id/status — admin only
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/orders/admin/all — admin: all orders
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  let query = supabase
    .from('orders')
    .select('*, profiles(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ orders: data, total: count });
});

module.exports = router;
