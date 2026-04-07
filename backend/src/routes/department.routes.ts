import { Router } from 'express';
import { DepartmentController, deptValidation } from '../controllers/department.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/tree', authenticate, DepartmentController.getTree);
router.get('/', authenticate, DepartmentController.list);
router.post('/', authenticate, isAdmin, deptValidation.create, DepartmentController.create);
router.get('/:id', authenticate, DepartmentController.getById);
router.put('/:id', authenticate, isAdmin, DepartmentController.update);

export default router;
