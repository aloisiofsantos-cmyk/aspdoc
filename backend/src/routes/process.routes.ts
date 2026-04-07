import { Router } from 'express';
import { ProcessController, processValidation } from '../controllers/process.controller';
import { authenticate, isManager } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate, ProcessController.getDashboard);
router.get('/public/:number', ProcessController.getPublicStatus);
router.get('/', authenticate, ProcessController.list);
router.post('/', authenticate, processValidation.create, ProcessController.create);
router.get('/:id', authenticate, ProcessController.getById);
router.put('/:id', authenticate, ProcessController.update);
router.post('/:id/forward', authenticate, processValidation.forward, ProcessController.forward);
router.post('/:id/close', authenticate, ProcessController.close);

export default router;
