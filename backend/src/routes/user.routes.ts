import { Router } from 'express';
import { UserController, userValidation } from '../controllers/user.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/notifications', authenticate, UserController.getNotifications);
router.put('/notifications/:id/read', authenticate, UserController.markNotificationRead);
router.put('/profile', authenticate, UserController.updateProfile);
router.get('/', authenticate, isAdmin, UserController.list);
router.post('/', authenticate, isAdmin, userValidation.create, UserController.create);
router.get('/:id', authenticate, UserController.getById);
router.put('/:id', authenticate, isAdmin, UserController.update);
router.post('/:id/reset-password', authenticate, isAdmin, UserController.resetPassword);
router.delete('/:id/deactivate', authenticate, isAdmin, UserController.deactivate);

export default router;
