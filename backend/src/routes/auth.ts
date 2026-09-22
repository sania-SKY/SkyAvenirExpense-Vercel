import { Router } from 'express';

import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get(
  '/me',
  requireAuth,
  (req, res) => {
    res.json({
      authenticated: true,
      user: req.user,
    });
  },
);

router.post(
  '/logout',
  (_req, res) => {
    res.json({
      success: true,
    });
  },
);

export default router;