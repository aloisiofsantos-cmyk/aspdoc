import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();

router.get('/', authenticate, async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    res.json({ success: true, data: settingsMap });
  } catch (error) {
    next(error);
  }
});

router.put('/', authenticate, isAdmin, async (req, res, next) => {
  try {
    const updates = req.body as Record<string, string>;
    const promises = Object.entries(updates).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );
    await Promise.all(promises);
    res.json({ success: true, message: 'Configurações salvas' });
  } catch (error) {
    next(error);
  }
});

router.get('/process-types', authenticate, async (_req, res, next) => {
  try {
    const types = await prisma.processType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: types });
  } catch (error) {
    next(error);
  }
});

router.post('/process-types', authenticate, isAdmin, async (req, res, next) => {
  try {
    const type = await prisma.processType.create({ data: req.body });
    res.status(201).json({ success: true, data: type });
  } catch (error) {
    next(error);
  }
});

router.put('/process-types/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const type = await prisma.processType.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: type });
  } catch (error) {
    next(error);
  }
});

export default router;
