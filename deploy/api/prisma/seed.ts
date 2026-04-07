import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Configurações do sistema
  const settings = [
    { key: 'org_name', value: 'Prefeitura Municipal de Exemplo', description: 'Nome da organização' },
    { key: 'org_cnpj', value: '00.000.000/0001-00', description: 'CNPJ da organização' },
    { key: 'protocol_prefix', value: 'PROC', description: 'Prefixo do número de protocolo' },
    { key: 'email_notifications', value: 'true', description: 'Enviar notificações por email' },
    { key: 'max_file_size', value: '52428800', description: 'Tamanho máximo de arquivo (bytes)' },
    { key: 'allow_govbr_login', value: 'true', description: 'Permitir login via Gov.br' },
    { key: 'signature_required', value: 'false', description: 'Assinatura obrigatória em processos' },
    { key: 'sla_alert_days', value: '3', description: 'Dias antes do vencimento para alertar' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Departamentos padrão
  const rootDept = await prisma.department.upsert({
    where: { code: 'PREF' },
    update: {},
    create: {
      name: 'Prefeitura Municipal',
      code: 'PREF',
      description: 'Órgão principal',
    },
  });

  const gabinete = await prisma.department.upsert({
    where: { code: 'GAB' },
    update: {},
    create: {
      name: 'Gabinete do Prefeito',
      code: 'GAB',
      parentId: rootDept.id,
    },
  });

  const secretariaAdm = await prisma.department.upsert({
    where: { code: 'SADM' },
    update: {},
    create: {
      name: 'Secretaria de Administração',
      code: 'SADM',
      parentId: rootDept.id,
    },
  });

  await prisma.department.upsert({
    where: { code: 'PROTO' },
    update: {},
    create: {
      name: 'Protocolo Geral',
      code: 'PROTO',
      parentId: secretariaAdm.id,
    },
  });

  await prisma.department.upsert({
    where: { code: 'RH' },
    update: {},
    create: {
      name: 'Recursos Humanos',
      code: 'RH',
      parentId: secretariaAdm.id,
    },
  });

  const secretariaFin = await prisma.department.upsert({
    where: { code: 'SFIN' },
    update: {},
    create: {
      name: 'Secretaria de Finanças',
      code: 'SFIN',
      parentId: rootDept.id,
    },
  });

  await prisma.department.upsert({
    where: { code: 'CONT' },
    update: {},
    create: {
      name: 'Contabilidade',
      code: 'CONT',
      parentId: secretariaFin.id,
    },
  });

  // Tipos de processo
  const processTypes = [
    { name: 'Requerimento Geral', code: 'REQ', description: 'Requerimentos gerais da população', isPublic: true },
    { name: 'Ofício', code: 'OFI', description: 'Ofícios e comunicações oficiais', isPublic: false },
    { name: 'Contrato', code: 'CONT', description: 'Contratos e convênios', requiresSignature: true, isPublic: false },
    { name: 'Licitação', code: 'LIC', description: 'Processos licitatórios', isPublic: true },
    { name: 'Recurso', code: 'REC', description: 'Recursos administrativos', isPublic: true, slaDays: 30 },
    { name: 'Licença', code: 'LIC2', description: 'Solicitações de licença', isPublic: true, slaDays: 15 },
    { name: 'Portaria', code: 'PORT', description: 'Portarias e atos administrativos', requiresSignature: true },
    { name: 'Decreto', code: 'DEC', description: 'Decretos municipais', requiresSignature: true },
    { name: 'Memorando', code: 'MEM', description: 'Comunicações internas' },
    { name: 'Nota Fiscal', code: 'NF', description: 'Notas fiscais e pagamentos' },
  ];

  for (const pt of processTypes) {
    await prisma.processType.upsert({
      where: { code: pt.code },
      update: {},
      create: pt,
    });
  }

  // Usuário administrador padrão
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@agildoc.com.br' },
    update: {},
    create: {
      name: 'Administrador do Sistema',
      email: 'admin@agildoc.com.br',
      cpf: '000.000.000-00',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
      departmentId: rootDept.id,
      isActive: true,
    },
  });

  // Usuário gestor de exemplo
  const managerPassword = await bcrypt.hash('Gestor@123', 12);
  await prisma.user.upsert({
    where: { email: 'gestor@agildoc.com.br' },
    update: {},
    create: {
      name: 'Maria Silva - Gestora',
      email: 'gestor@agildoc.com.br',
      cpf: '111.111.111-11',
      password: managerPassword,
      role: UserRole.MANAGER,
      departmentId: secretariaAdm.id,
      phone: '(81) 99999-0001',
      isActive: true,
    },
  });

  // Usuário servidor de exemplo
  const officerPassword = await bcrypt.hash('Servidor@123', 12);
  await prisma.user.upsert({
    where: { email: 'servidor@agildoc.com.br' },
    update: {},
    create: {
      name: 'João Santos - Servidor',
      email: 'servidor@agildoc.com.br',
      cpf: '222.222.222-22',
      password: officerPassword,
      role: UserRole.OFFICER,
      departmentId: gabinete.id,
      phone: '(81) 99999-0002',
      isActive: true,
    },
  });

  // Contador de protocolo para o ano atual
  const currentYear = new Date().getFullYear();
  await prisma.protocolCounter.upsert({
    where: { year: currentYear },
    update: {},
    create: { year: currentYear, sequence: 0 },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('');
  console.log('👤 Usuários criados:');
  console.log('  Admin:    admin@agildoc.com.br   / Admin@123');
  console.log('  Gestor:   gestor@agildoc.com.br  / Gestor@123');
  console.log('  Servidor: servidor@agildoc.com.br / Servidor@123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
