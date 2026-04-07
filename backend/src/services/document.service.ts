import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error.middleware';
import { config } from '../config/env';

export class DocumentService {
  static computeHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  static async create(data: {
    processId: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    uploadedById: string;
    isMain?: boolean;
  }) {
    const hash = this.computeHash(data.path);

    const document = await prisma.document.create({
      data: {
        ...data,
        hash,
        isMain: data.isMain || false,
      },
      include: {
        signatures: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    await prisma.activity.create({
      data: {
        processId: data.processId,
        userId: data.uploadedById,
        action: 'DOCUMENT_UPLOADED',
        entity: 'Document',
        entityId: document.id,
        details: { name: data.name, originalName: data.originalName },
      },
    });

    return document;
  }

  static async findByProcess(processId: string) {
    return prisma.document.findMany({
      where: { processId },
      include: {
        signatures: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async findById(id: string) {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        process: { select: { id: true, number: true, title: true } },
        signatures: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!doc) throw new AppError('Documento não encontrado', 404);
    return doc;
  }

  static async delete(id: string, userId: string) {
    const doc = await this.findById(id);

    if (fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path);
    }

    await prisma.document.delete({ where: { id } });

    await prisma.activity.create({
      data: {
        processId: doc.processId,
        userId,
        action: 'DOCUMENT_DELETED',
        entity: 'Document',
        entityId: id,
        details: { name: doc.name },
      },
    });
  }

  static async requestSignature(documentId: string, requesterId: string, type: 'DIGITAL_CERT' | 'GOV_BR' | 'ELECTRONIC') {
    const doc = await this.findById(documentId);

    // Check if already has pending signature for this user
    const existing = await prisma.signature.findFirst({
      where: {
        documentId,
        userId: requesterId,
        status: 'PENDING',
      },
    });

    if (existing) throw new AppError('Já existe uma solicitação de assinatura pendente', 400);

    const signature = await prisma.signature.create({
      data: {
        documentId,
        userId: requesterId,
        type,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        document: { select: { id: true, name: true } },
      },
    });

    await prisma.process.update({
      where: { id: doc.processId },
      data: { status: 'WAITING_SIGNATURE' },
    });

    return signature;
  }

  static async signDocument(
    signatureId: string,
    userId: string,
    signatureData?: string
  ) {
    const signature = await prisma.signature.findUnique({
      where: { id: signatureId },
      include: { document: true, user: true },
    });

    if (!signature) throw new AppError('Assinatura não encontrada', 404);
    if (signature.userId !== userId) throw new AppError('Não autorizado', 403);
    if (signature.status !== 'PENDING') throw new AppError('Assinatura já processada', 400);

    const signedAt = new Date();
    const hash = crypto
      .createHash('sha256')
      .update(`${signatureId}${userId}${signedAt.toISOString()}`)
      .digest('hex');

    const updatedSignature = await prisma.signature.update({
      where: { id: signatureId },
      data: {
        status: 'SIGNED',
        signedAt,
        hash,
        signatureData,
      },
    });

    // Mark document as signed
    await prisma.document.update({
      where: { id: signature.documentId },
      data: { isSigned: true },
    });

    // Embed signature in PDF if it's a PDF
    if (signature.document.mimeType === 'application/pdf') {
      await this.embedSignatureInPdf(signature.document.path, {
        signerName: signature.user.name,
        signedAt,
        hash,
        signatureId,
      });
    }

    await prisma.activity.create({
      data: {
        processId: signature.document.processId,
        userId,
        action: 'DOCUMENT_SIGNED',
        entity: 'Signature',
        entityId: signatureId,
        details: { documentId: signature.documentId, type: signature.type },
      },
    });

    return updatedSignature;
  }

  static async embedSignatureInPdf(
    filePath: string,
    signatureInfo: { signerName: string; signedAt: Date; hash: string; signatureId: string }
  ) {
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width } = lastPage.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const verifyUrl = `${config.frontendUrl}/verificar/${signatureInfo.signatureId}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 80 });
      const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      const qrImage = await pdfDoc.embedPng(qrImageBytes);

      const boxHeight = 90;
      const boxY = 30;
      const boxX = 20;
      const boxWidth = width - 40;

      lastPage.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        borderColor: rgb(0.2, 0.4, 0.8),
        borderWidth: 1,
        color: rgb(0.95, 0.97, 1),
      });

      lastPage.drawText('✓ ASSINADO DIGITALMENTE', {
        x: boxX + 10,
        y: boxY + 70,
        size: 9,
        font,
        color: rgb(0.1, 0.5, 0.1),
      });

      lastPage.drawText(`Assinado por: ${signatureInfo.signerName}`, {
        x: boxX + 10,
        y: boxY + 55,
        size: 8,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      lastPage.drawText(`Data/Hora: ${signatureInfo.signedAt.toLocaleString('pt-BR')}`, {
        x: boxX + 10,
        y: boxY + 42,
        size: 8,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });

      lastPage.drawText(`Hash: ${signatureInfo.hash.substring(0, 32)}...`, {
        x: boxX + 10,
        y: boxY + 29,
        size: 7,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });

      lastPage.drawText('Verifique em: ' + verifyUrl, {
        x: boxX + 10,
        y: boxY + 16,
        size: 7,
        font,
        color: rgb(0.2, 0.4, 0.8),
      });

      lastPage.drawImage(qrImage, {
        x: boxX + boxWidth - 90,
        y: boxY + 5,
        width: 80,
        height: 80,
      });

      const signedPdfBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, signedPdfBytes);
    } catch (err) {
      // Non-fatal: signature embedding failed
      console.error('Error embedding signature in PDF:', err);
    }
  }

  static async verifySignature(signatureId: string) {
    const signature = await prisma.signature.findUnique({
      where: { id: signatureId },
      include: {
        user: { select: { id: true, name: true, cpf: true } },
        document: {
          select: {
            id: true,
            name: true,
            hash: true,
            process: { select: { number: true, title: true } },
          },
        },
      },
    });

    if (!signature) throw new AppError('Assinatura não encontrada', 404);

    return {
      valid: signature.status === 'SIGNED',
      signature: {
        id: signature.id,
        status: signature.status,
        type: signature.type,
        signedAt: signature.signedAt,
        hash: signature.hash,
        signer: signature.user,
        document: signature.document,
      },
    };
  }
}
