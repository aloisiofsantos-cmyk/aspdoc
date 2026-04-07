import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, isManager } from '../middleware/auth.middleware';

const router = Router();

router.get('/summary', authenticate, ReportController.summary);
router.get('/by-status', authenticate, isManager, ReportController.processByStatus);
router.get('/by-type', authenticate, isManager, ReportController.processByType);
router.get('/by-department', authenticate, isManager, ReportController.processByDepartment);
router.get('/monthly', authenticate, isManager, ReportController.monthlyEvolution);
router.get('/overdue', authenticate, ReportController.overdue);

export default router;
