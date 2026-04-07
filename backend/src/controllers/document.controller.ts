import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { DocumentService } from '../services/document.service';
import { EmailService } from '../services/email.service';
import { AuthRequest } from '../types';
import { prisma } from '../config/prisma';

export class DocumentController {
  static async upload(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
        return;
      }

      const { processId, isMain } = req.body;
      if (!processId) {
        res.status(400).json({ success: false, message: 'processId é obrigatório' });
        return;
      }

      const document = await DocumentService.create({
        processId,
        name: req.body.name || req.file.originalname,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedById: req.user!.id,
        isMain: isMain === 'true',
      });

      res.status(201).json({
        success: true,
        message: 'Documento enviado com sucesso',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByProcess(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const documents = await DocumentService.findByProcess(req.params.processId);
      res.json({ success: true, data: documents });
    } catch (error) {
      next(error);
    }
  }

  static async download(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const document = await DocumentService.findById(req.params.id);

      if (!fs.existsSync(document.path)) {
        res.status(404).json({ success: false, message: 'Arquivo não encontrado no servidor' });
        return;
      }

      res.download(document.path, document.originalName);
    } catch (error) {
      next(error);
    }
  }

  static async view(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const document = await DocumentService.findById(req.params.id);

      if (!fs.existsSync(document.path)) {
        res.status(404).json({ success: false, message: 'Arquivo não encontrado' });
        return;
      }

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      fs.createReadStream(document.path).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await DocumentService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Documento excluído' });
    } catch (error) {
      next(error);
    }
  }

  static async requestSignature(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentId, type, signerIds } = req.body;
      const signatures = [];

      for (const signerId of (signerIds || [req.user!.id])) {
        const sig = await DocumentService.requestSignature(documentId, signerId, type || 'ELECTRONIC');
        signatures.push(sig);

        // Notify signer
        const signer = await prisma.user.findUnique({ where: { id: signerId } });
        const doc = await DocumentService.findById(documentId);

        if (signer?.email) {
          EmailService.sendSignatureRequest(signer.email, {
            signerName: signer.name,
            documentName: doc.name,
            processNumber: doc.process.number,
            signatureId: sig.id,
          }).catch(() => {});
        }
      }

      res.status(201).json({
        success: true,
        message: 'Solicitação de assinatura enviada',
        data: signatures,
      });
    } catch (error) {
      next(error);
    }
  }

  static async sign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { signatureId } = req.params;
      const { signatureData } = req.body;

      const signature = await DocumentService.signDocument(signatureId, req.user!.id, signatureData);

      res.json({
        success: true,
        message: 'Documento assinado com sucesso',
        data: signature,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verify(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await DocumentService.verifySignature(req.params.signatureId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingSignatures(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const signatures = await prisma.signature.findMany({
        where: {
          userId: req.user!.id,
          status: 'PENDING',
        },
        include: {
          document: {
            include: {
              process: { select: { number: true, title: true } },
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });

      res.json({ success: true, data: signatures });
    } catch (error) {
      next(error);
    }
  }
}
