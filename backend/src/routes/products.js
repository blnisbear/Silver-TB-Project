const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/products — list with filter, search, pagination
router.get('/', async (req, res) => {
  const { search, category, min_price, max_price, sort = 'created_at', order = 'desc', page = 1, limit = 12 } = req.query;

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (min_price) {
    query = query.gte('price', Number(min_price));
  }
  if (max_price) {
    query = query.lte('price', Number(max_price));
  }

  const allowedSort = ['created_at', 'price', 'name', 'views'];
  const sortField = allowedSort.includes(sort) ? sort : 'created_at';
  query = query.order(sortField, { ascending: order === 'asc' });

  const from = (Number(page) - 1) * Number(limit);
  query = query.range(from, from + Number(limit) - 1);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Increment view count (fire and forget)
  res.json({ products: data, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('is_active', true);

  if (error) return res.status(500).json({ error: error.message });
  const categories = [...new Set(data.map((p) => p.category).filter(Boolean))];
  res.json(categories);
});

// GET /api/products/best-sellers
router.get('/best-sellers', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_best_seller', true)
    .limit(6);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Product not found' });

  // Increment views
  supabase.from('products').update({ views: (data.views || 0) + 1 }).eq('id', data.id);

  res.json(data);
});

// POST /api/products — admin only
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, name_th, description, description_th, price, stock, category, images, is_best_seller } = req.body;

  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'name, price, and stock are required' });
  }

  const { data, error } = await supabase
    .from('products')
    .insert({ name, name_th, description, description_th, price, stock, category, images: images || [], is_best_seller: is_best_seller || false, is_active: true, views: 0 })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/products/:id — admin only
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const allowed = ['name', 'name_th', 'description', 'description_th', 'price', 'stock', 'category', 'images', 'is_best_seller', 'is_active'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/products/:id — admin only (soft delete)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Product deactivated' });
});

module.exports = router;
