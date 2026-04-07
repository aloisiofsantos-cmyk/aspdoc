import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f6f9; }
  .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 24px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 22px; }
  .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; }
  .body { padding: 30px; }
  .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0; }
  .info-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
  .info-box p { margin: 4px 0; font-size: 14px; color: #1e40af; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>AgilDoc</h1>
    <p>Sistema de Gestão Documental</p>
  </div>
  <div class="body">
    <h2 style="color:#1e293b;">${title}</h2>
    ${content}
  </div>
  <div class="footer">
    <p>${config.org.name}</p>
    <p>Este é um email automático. Não responda a esta mensagem.</p>
  </div>
</div>
</body>
</html>
`;

export class EmailService {
  static async sendProcessCreated(to: string, process: { number: string; title: string; type: string }) {
    const content = `
      <p>Um novo processo foi criado no sistema AgilDoc.</p>
      <div class="info-box">
        <p><strong>Número:</strong> ${process.number}</p>
        <p><strong>Assunto:</strong> ${process.title}</p>
        <p><strong>Tipo:</strong> ${process.type}</p>
      </div>
      <p>Acesse o sistema para acompanhar o andamento.</p>
      <a href="${config.frontendUrl}/processos" class="btn">Ver Processo</a>
    `;

    await this.send(to, `Novo Processo: ${process.number}`, baseTemplate(content, 'Novo Processo Criado'));
  }

  static async sendProcessForwarded(to: string, data: {
    processNumber: string;
    processTitle: string;
    fromDept: string;
    toDept: string;
    observation?: string;
  }) {
    const content = `
      <p>O processo abaixo foi encaminhado para o seu setor.</p>
      <div class="info-box">
        <p><strong>Número:</strong> ${data.processNumber}</p>
        <p><strong>Assunto:</strong> ${data.processTitle}</p>
        <p><strong>De:</strong> ${data.fromDept}</p>
        <p><strong>Para:</strong> ${data.toDept}</p>
        ${data.observation ? `<p><strong>Observação:</strong> ${data.observation}</p>` : ''}
      </div>
      <a href="${config.frontendUrl}/processos" class="btn">Acessar Processo</a>
    `;

    await this.send(
      to,
      `Processo Encaminhado: ${data.processNumber}`,
      baseTemplate(content, 'Processo Encaminhado')
    );
  }

  static async sendSignatureRequest(to: string, data: {
    signerName: string;
    documentName: string;
    processNumber: string;
    signatureId: string;
  }) {
    const content = `
      <p>Olá, <strong>${data.signerName}</strong>!</p>
      <p>Você tem um documento aguardando sua assinatura.</p>
      <div class="info-box">
        <p><strong>Documento:</strong> ${data.documentName}</p>
        <p><strong>Processo:</strong> ${data.processNumber}</p>
      </div>
      <a href="${config.frontendUrl}/assinar/${data.signatureId}" class="btn">Assinar Documento</a>
      <p style="font-size:12px;color:#64748b;">A solicitação expira em 7 dias.</p>
    `;

    await this.send(
      to,
      `Documento aguardando assinatura - ${data.processNumber}`,
      baseTemplate(content, 'Solicitação de Assinatura')
    );
  }

  static async sendWelcome(to: string, name: string, password?: string) {
    const content = `
      <p>Bem-vindo(a) ao <strong>AgilDoc</strong>, ${name}!</p>
      <p>Sua conta foi criada com sucesso no Sistema de Gestão Documental.</p>
      ${password ? `
      <div class="info-box">
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Senha temporária:</strong> ${password}</p>
      </div>
      <p>Por segurança, altere sua senha no primeiro acesso.</p>
      ` : ''}
      <a href="${config.frontendUrl}/login" class="btn">Acessar o Sistema</a>
    `;

    await this.send(to, 'Bem-vindo ao AgilDoc', baseTemplate(content, 'Conta Criada com Sucesso'));
  }

  private static async send(to: string, subject: string, html: string) {
    try {
      if (!config.smtp.user) {
        logger.info('Email simulado (SMTP não configurado)', { to, subject });
        return;
      }

      await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      });

      logger.info('Email enviado', { to, subject });
    } catch (error) {
      logger.error('Erro ao enviar email', { to, subject, error });
    }
  }
}
