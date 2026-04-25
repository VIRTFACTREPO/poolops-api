import { Router } from 'express';
import { authRateLimit } from '../middleware/rateLimit.js';
import {
  forgotPassword,
  getCurrentUserProfile,
  loginWithPassword,
  logoutFromSession,
  setPasswordByInviteToken,
} from '../services/auth.service.js';

const router = Router();
router.use(authRateLimit);

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'email and password are required' },
      });
    }

    const data = await loginWithPassword(email, password);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err?.code === 'UNAUTHORIZED') {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
      });
    }

    return res.status(500).json({
      success: false,
      error: { code: err?.code || 'INTERNAL_ERROR', message: err?.message || 'Login failed' },
    });
  }
});

router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' },
      });
    }

    const data = await getCurrentUserProfile(token);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err?.code === 'UNAUTHORIZED' ? 401 : 500;
    return res.status(status).json({
      success: false,
      error: { code: err?.code || 'INTERNAL_ERROR', message: err?.message || 'Failed to fetch user' },
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'email is required' },
      });
    }

    const data = await forgotPassword(email);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err?.message || 'Failed to process forgot-password' },
    });
  }
});

router.post('/set-password', async (req, res) => {
  try {
    const { invite_token: inviteToken, password } = req.body || {};
    if (!inviteToken || !password) {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'invite_token and password are required' },
      });
    }

    const data = await setPasswordByInviteToken(inviteToken, password);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err?.code === 'VALIDATION_ERROR') {
      return res.status(422).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid or expired invite token' },
      });
    }
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err?.message || 'Failed to set password' },
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' },
      });
    }

    await logoutFromSession(token);
    return res.status(200).json({ success: true, data: { loggedOut: true } });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: err?.code || 'INTERNAL_ERROR', message: err?.message || 'Logout failed' },
    });
  }
});

export default router;
