import { Router } from 'express';
import { getGoogleAuthUrl, getGoogleUserInfo } from '../services/googleAuth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { config } from '../config/index.js';

const router = Router();

// Step 1: Redirect to Google consent screen
router.get('/google', (req, res) => {
  const authUrl = getGoogleAuthUrl();
  res.redirect(authUrl);
});

// Step 2: Google callback - exchange code for user info
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const googleUser = await getGoogleUserInfo(code);

    // Check if user exists in our database
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    let user = existingUser;

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (user not found)
      throw fetchError;
    }

    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: googleUser.email,
          name: googleUser.name,
          avatar_url: googleUser.picture,
          google_id: googleUser.googleId,
          auth_provider: 'google',
        })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    // Redirect to frontend with user info (in production, use JWT tokens)
    const params = new URLSearchParams({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    res.redirect(`${config.clientUrl}/auth/callback?${params}`);
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.redirect(`${config.clientUrl}/login?error=auth_failed`);
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // In production, verify JWT token here
    // For now, we'll use a simple user ID from header
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'No user ID' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
