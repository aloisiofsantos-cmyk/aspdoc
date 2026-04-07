import { Router } from 'express';
import authRoutes from './auth.routes';
import processRoutes from './process.routes';
import documentRoutes from './document.routes';
import userRoutes from './user.routes';
import departmentRoutes from './department.routes';
import reportRoutes from './report.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/processes', processRoutes);
router.use('/documents', documentRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

export default router;
