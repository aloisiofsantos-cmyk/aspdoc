import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/signatures/pending', authenticate, DocumentController.getPendingSignatures);
router.get('/verify/:signatureId', DocumentController.verify);
router.get('/process/:processId', authenticate, DocumentController.getByProcess);
router.post('/upload', authenticate, upload.single('file'), DocumentController.upload);
router.get('/:id/download', authenticate, DocumentController.download);
router.get('/:id/view', authenticate, DocumentController.view);
router.delete('/:id', authenticate, DocumentController.delete);
router.post('/signatures', authenticate, DocumentController.requestSignature);
router.post('/signatures/:signatureId/sign', authenticate, DocumentController.sign);

export default router;
