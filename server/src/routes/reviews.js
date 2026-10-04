import { Router } from 'express';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

// Get reviews for a product (newest first) plus the average rating
router.get('/:productId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('product_id', req.params.productId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reviews = data || [];
    const average =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({ reviews, average, count: reviews.length });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add a review for a product
router.post('/', async (req, res) => {
  try {
    const { productId, userId, userName, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ error: 'productId and rating are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: userId || null,
        user_name: userName || 'Anonymous',
        rating: Number(rating),
        comment: comment || '',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

export default router;
