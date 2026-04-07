const express = require('express');
const axios = require('axios');
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const LINE_API = 'https://api.line.me/v2/bot/message';

/**
 * Send a LINE OA push message to a user.
 * Requires the user profile to have a line_user_id stored.
 */
async function sendLineMessage(lineUserId, messages) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !lineUserId) return;

  await axios.post(
    `${LINE_API}/push`,
    { to: lineUserId, messages },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
}

/**
 * Notify user on LINE when their order is successfully paid.
 * Called internally from payments webhook.
 */
async function notifyLineOrderSuccess(orderId) {
  const { data: order } = await supabase
    .from('orders')
    .select('*, profiles(full_name, line_user_id)')
    .eq('id', orderId)
    .single();

  if (!order) return;
  const lineUserId = order.profiles?.line_user_id;
  if (!lineUserId) return;

  const itemsSummary = order.items
    .map((i) => `• ${i.name} x${i.quantity} — ฿${(i.price * i.quantity).toLocaleString()}`)
    .join('\n');

  await sendLineMessage(lineUserId, [
    {
      type: 'text',
      text: `✅ ยืนยันการชำระเงินสำเร็จ!\n\nหมายเลขออเดอร์: ${order.id.slice(0, 8)}\n\n${itemsSummary}\n\nยอดรวม: ฿${order.total.toLocaleString()}\n\nขอบคุณที่ซื้อสินค้ากับ Silver Thief Bug 🪲`,
    },
  ]);
}

// POST /api/notifications/broadcast — admin send broadcast to all LINE subscribers
router.post('/broadcast', authenticate, requireAdmin, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    await axios.post(
      `${LINE_API}/broadcast`,
      {
        messages: [{ type: 'text', text: message }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// POST /api/notifications/line/webhook — receive LINE OA webhook events
router.post('/line/webhook', async (req, res) => {
  const events = req.body.events || [];

  for (const event of events) {
    if (event.type === 'follow') {
      // User followed the OA — save their line_user_id if we can match by email
      // For now just acknowledge
      console.log('New LINE follower:', event.source.userId);
    }
  }

  res.sendStatus(200);
});

module.exports = router;
module.exports.notifyLineOrderSuccess = notifyLineOrderSuccess;
