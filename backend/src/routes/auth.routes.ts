import { Router } from 'express';
import { AuthController, authValidation } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { success: false, message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

router.post('/login', loginLimiter, authValidation.login, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.get('/govbr', AuthController.govBrInit);
router.get('/govbr/callback', AuthController.govBrCallback);
router.put('/password', authenticate, authValidation.changePassword, AuthController.changePassword);

export default router;
