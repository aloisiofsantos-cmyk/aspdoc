import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  govBr: {
    clientId: process.env.GOVBR_CLIENT_ID || '',
    clientSecret: process.env.GOVBR_CLIENT_SECRET || '',
    redirectUri: process.env.GOVBR_REDIRECT_URI || '',
    authUrl: process.env.GOVBR_AUTH_URL || 'https://sso.acesso.gov.br/authorize',
    tokenUrl: process.env.GOVBR_TOKEN_URL || 'https://sso.acesso.gov.br/token',
    userInfoUrl: process.env.GOVBR_USERINFO_URL || 'https://sso.acesso.gov.br/userinfo',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'AgilDoc <noreply@agildoc.com.br>',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'application/pdf,image/jpeg,image/png').split(','),
  },

  org: {
    name: process.env.ORG_NAME || 'Prefeitura Municipal',
    cnpj: process.env.ORG_CNPJ || '',
    logoUrl: process.env.ORG_LOGO_URL || '',
  },
};
