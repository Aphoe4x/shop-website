import { Router } from 'express';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

// Live cart subscribers keyed by user id: Map<userId, Set<response>>
const subscribers = new Map();

/**
 * Register an SSE connection for a user so cart changes push instantly.
 * @param {string} userId - The user id to watch.
 * @param {import('express').Response} res - The SSE response.
 */
function addSubscriber(userId, res) {
  if (!subscribers.has(userId)) subscribers.set(userId, new Set());
  subscribers.get(userId).add(res);

  res.on('close', () => {
    const set = subscribers.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) subscribers.delete(userId);
  });
}

/**
 * Push the latest cart to every open stream for a user.
 * @param {string} userId - The user id whose cart changed.
 * @param {Array} items - The new cart items.
 */
function broadcast(userId, items) {
  const set = subscribers.get(userId);
  if (!set) return;
  const payload = `data: ${JSON.stringify({ type: 'cart', items })}\n\n`;
  for (const res of set) {
    res.write(payload);
  }
}

/**
 * Load a user's cart joined with product details.
 * @param {string} userId - The user id.
 * @returns {Promise<Array>} Cart rows with product data.
 */
async function loadCart(userId) {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select('product_id, quantity, updated_at, products(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    productId: row.product_id,
    quantity: row.quantity,
    updatedAt: row.updated_at,
    product: row.products,
  }));
}

// Get a user's cart
router.get('/:userId', async (req, res) => {
  try {
    const items = await loadCart(req.params.userId);
    res.json(items);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

// Live stream of cart updates (Server-Sent Events)
router.get('/:userId/stream', async (req, res) => {
  const { userId } = req.params;

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.flushHeaders?.();

  try {
    const items = await loadCart(userId);
    res.write(`data: ${JSON.stringify({ type: 'cart', items })}\n\n`);
  } catch (error) {
    console.error('Cart stream init error:', error);
  }

  addSubscriber(userId, res);

  const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 25000);
  res.on('close', () => clearInterval(keepAlive));
});

// Replace a user's cart with the given items
router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const items = Array.isArray(req.body?.items) ? req.body.items : [];

  try {
    const { error: deleteError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    const rows = items
      .filter((item) => item?.productId && Number(item.quantity) > 0)
      .map((item) => ({
        user_id: userId,
        product_id: item.productId,
        quantity: Number(item.quantity),
        updated_at: new Date().toISOString(),
      }));

    if (rows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('cart_items')
        .insert(rows);
      if (insertError) throw insertError;
    }

    const updated = await loadCart(userId);
    broadcast(userId, updated);
    res.json({ message: 'Cart updated', items: updated });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Clear a user's cart
router.delete('/:userId', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', req.params.userId);

    if (error) throw error;

    broadcast(req.params.userId, []);
    res.json({ message: 'Cart cleared', items: [] });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
