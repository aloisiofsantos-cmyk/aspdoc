-- ============================================================
-- AgilDoc - Script SQL para MySQL (UOL MeuPainelHost)
-- Execute este script no phpMyAdmin do seu cPanel UOL
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- Tabela de departamentos
CREATE TABLE IF NOT EXISTS `departments` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text,
  `parentId` varchar(36) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_code_key` (`code`),
  KEY `departments_parentId_fkey` (`parentId`),
  CONSTRAINT `departments_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `cpf` varchar(20) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('SUPER_ADMIN','ADMIN','MANAGER','OFFICER','CITIZEN') NOT NULL DEFAULT 'OFFICER',
  `departmentId` varchar(36) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `govBrId` varchar(255) DEFAULT NULL,
  `govBrToken` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `lastLogin` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_cpf_key` (`cpf`),
  UNIQUE KEY `users_govBrId_key` (`govBrId`),
  KEY `users_departmentId_fkey` (`departmentId`),
  CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de refresh tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_token_key` (`token`),
  KEY `refresh_tokens_userId_fkey` (`userId`),
  CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de tipos de processo
CREATE TABLE IF NOT EXISTS `process_types` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `requiresSignature` tinyint(1) NOT NULL DEFAULT 0,
  `slaDays` int DEFAULT NULL,
  `isPublic` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `process_types_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de processos
CREATE TABLE IF NOT EXISTS `processes` (
  `id` varchar(36) NOT NULL,
  `number` varchar(30) NOT NULL,
  `year` int NOT NULL,
  `sequence` int NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('OPEN','IN_PROGRESS','PENDING','WAITING_SIGNATURE','COMPLETED','ARCHIVED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  `priority` enum('LOW','NORMAL','HIGH','URGENT') NOT NULL DEFAULT 'NORMAL',
  `typeId` varchar(36) NOT NULL,
  `departmentId` varchar(36) NOT NULL,
  `creatorId` varchar(36) NOT NULL,
  `assigneeId` varchar(36) DEFAULT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `closedAt` datetime(3) DEFAULT NULL,
  `isConfidential` tinyint(1) NOT NULL DEFAULT 0,
  `externalName` varchar(255) DEFAULT NULL,
  `externalCpf` varchar(20) DEFAULT NULL,
  `externalEmail` varchar(255) DEFAULT NULL,
  `externalPhone` varchar(20) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `processes_number_key` (`number`),
  KEY `processes_typeId_fkey` (`typeId`),
  KEY `processes_departmentId_fkey` (`departmentId`),
  KEY `processes_creatorId_fkey` (`creatorId`),
  KEY `processes_assigneeId_fkey` (`assigneeId`),
  CONSTRAINT `processes_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `process_types` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `processes_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `processes_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `processes_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de tags dos processos
CREATE TABLE IF NOT EXISTS `process_tags` (
  `id` varchar(36) NOT NULL,
  `processId` varchar(36) NOT NULL,
  `tag` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `process_tags_processId_tag_key` (`processId`,`tag`),
  CONSTRAINT `process_tags_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `processes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS `documents` (
  `id` varchar(36) NOT NULL,
  `processId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `originalName` varchar(255) NOT NULL,
  `mimeType` varchar(100) NOT NULL,
  `size` int NOT NULL,
  `path` varchar(500) NOT NULL,
  `hash` varchar(64) DEFAULT NULL,
  `isSigned` tinyint(1) NOT NULL DEFAULT 0,
  `isMain` tinyint(1) NOT NULL DEFAULT 0,
  `uploadedById` varchar(36) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `documents_processId_fkey` (`processId`),
  CONSTRAINT `documents_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `processes` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de movimentações/tramitações
CREATE TABLE IF NOT EXISTS `movements` (
  `id` varchar(36) NOT NULL,
  `processId` varchar(36) NOT NULL,
  `fromDeptId` varchar(36) DEFAULT NULL,
  `toDeptId` varchar(36) DEFAULT NULL,
  `fromUserId` varchar(36) DEFAULT NULL,
  `toUserId` varchar(36) DEFAULT NULL,
  `userId` varchar(36) NOT NULL,
  `observation` text DEFAULT NULL,
  `type` enum('CREATED','FORWARDED','RETURNED','SIGNED','COMPLETED','ARCHIVED','COMMENTED','REOPENED','CANCELLED') NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `movements_processId_fkey` (`processId`),
  KEY `movements_fromDeptId_fkey` (`fromDeptId`),
  KEY `movements_userId_fkey` (`userId`),
  CONSTRAINT `movements_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `processes` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `movements_fromDeptId_fkey` FOREIGN KEY (`fromDeptId`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `movements_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS `signatures` (
  `id` varchar(36) NOT NULL,
  `documentId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `type` enum('DIGITAL_CERT','GOV_BR','ELECTRONIC') NOT NULL,
  `status` enum('PENDING','SIGNED','REJECTED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  `hash` varchar(64) DEFAULT NULL,
  `certificate` text DEFAULT NULL,
  `signatureData` text DEFAULT NULL,
  `govBrProtocol` varchar(255) DEFAULT NULL,
  `requestedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `signedAt` datetime(3) DEFAULT NULL,
  `expiresAt` datetime(3) DEFAULT NULL,
  `rejectedReason` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `signatures_documentId_fkey` (`documentId`),
  KEY `signatures_userId_fkey` (`userId`),
  CONSTRAINT `signatures_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `documents` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `signatures_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de atividades/auditoria
CREATE TABLE IF NOT EXISTS `activities` (
  `id` varchar(36) NOT NULL,
  `processId` varchar(36) DEFAULT NULL,
  `userId` varchar(36) NOT NULL,
  `action` varchar(100) NOT NULL,
  `entity` varchar(100) DEFAULT NULL,
  `entityId` varchar(36) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `userAgent` varchar(500) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `activities_processId_fkey` (`processId`),
  KEY `activities_userId_fkey` (`userId`),
  CONSTRAINT `activities_processId_fkey` FOREIGN KEY (`processId`) REFERENCES `processes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `activities_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('INFO','WARNING','SUCCESS','ERROR') NOT NULL DEFAULT 'INFO',
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `processId` varchar(36) DEFAULT NULL,
  `link` varchar(500) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `notifications_userId_fkey` (`userId`),
  CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS `settings` (
  `id` varchar(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `description` text DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de contador de protocolo
CREATE TABLE IF NOT EXISTS `protocol_counters` (
  `id` varchar(36) NOT NULL,
  `year` int NOT NULL,
  `sequence` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `protocol_counters_year_key` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DADOS INICIAIS (Seed)
-- ============================================================

-- Configurações do sistema
INSERT INTO `settings` (`id`, `key`, `value`, `description`, `updatedAt`) VALUES
(UUID(), 'org_name', 'Prefeitura Municipal', 'Nome da organização', NOW()),
(UUID(), 'org_cnpj', '00.000.000/0001-00', 'CNPJ da organização', NOW()),
(UUID(), 'protocol_prefix', 'PROC', 'Prefixo do número de protocolo', NOW()),
(UUID(), 'email_notifications', 'true', 'Enviar notificações por email', NOW()),
(UUID(), 'max_file_size', '20971520', 'Tamanho máximo de arquivo (bytes)', NOW()),
(UUID(), 'allow_govbr_login', 'true', 'Permitir login via Gov.br', NOW()),
(UUID(), 'signature_required', 'false', 'Assinatura obrigatória em processos', NOW()),
(UUID(), 'sla_alert_days', '3', 'Dias antes do vencimento para alertar', NOW());

-- Departamentos
SET @root_id = UUID();
SET @sadm_id = UUID();
SET @gab_id  = UUID();
SET @sfin_id = UUID();
SET @proto_id = UUID();
SET @rh_id    = UUID();
SET @cont_id  = UUID();

INSERT INTO `departments` (`id`, `name`, `code`, `description`, `parentId`, `isActive`, `createdAt`, `updatedAt`) VALUES
(@root_id,  'Prefeitura Municipal',       'PREF',  'Órgão principal',              NULL,       1, NOW(), NOW()),
(@gab_id,   'Gabinete do Prefeito',       'GAB',   NULL,                           @root_id,   1, NOW(), NOW()),
(@sadm_id,  'Secretaria de Administração','SADM',  NULL,                           @root_id,   1, NOW(), NOW()),
(@sfin_id,  'Secretaria de Finanças',     'SFIN',  NULL,                           @root_id,   1, NOW(), NOW()),
(@proto_id, 'Protocolo Geral',            'PROTO', NULL,                           @sadm_id,   1, NOW(), NOW()),
(@rh_id,    'Recursos Humanos',           'RH',    NULL,                           @sadm_id,   1, NOW(), NOW()),
(@cont_id,  'Contabilidade',              'CONT',  NULL,                           @sfin_id,   1, NOW(), NOW());

-- Tipos de processo
INSERT INTO `process_types` (`id`, `name`, `code`, `description`, `requiresSignature`, `slaDays`, `isPublic`, `isActive`, `createdAt`) VALUES
(UUID(), 'Requerimento Geral',  'REQ',   'Requerimentos gerais da população', 0, NULL, 1, 1, NOW()),
(UUID(), 'Ofício',              'OFI',   'Ofícios e comunicações oficiais',   0, NULL, 0, 1, NOW()),
(UUID(), 'Contrato',            'CONT2', 'Contratos e convênios',             1, NULL, 0, 1, NOW()),
(UUID(), 'Licitação',           'LIC',   'Processos licitatórios',            0, NULL, 1, 1, NOW()),
(UUID(), 'Recurso',             'REC',   'Recursos administrativos',          0, 30,   1, 1, NOW()),
(UUID(), 'Licença',             'LICE',  'Solicitações de licença',           0, 15,   1, 1, NOW()),
(UUID(), 'Portaria',            'PORT',  'Portarias e atos administrativos',  1, NULL, 0, 1, NOW()),
(UUID(), 'Decreto',             'DEC',   'Decretos municipais',               1, NULL, 0, 1, NOW()),
(UUID(), 'Memorando',           'MEM',   'Comunicações internas',             0, NULL, 0, 1, NOW()),
(UUID(), 'Nota Fiscal',         'NF',    'Notas fiscais e pagamentos',        0, NULL, 0, 1, NOW());

-- Contador de protocolo do ano atual
SET @cur_year = YEAR(NOW());
INSERT INTO `protocol_counters` (`id`, `year`, `sequence`) VALUES (UUID(), @cur_year, 0);

-- Usuários com senhas bcrypt geradas (custo 12)
INSERT INTO `users` (`id`, `name`, `email`, `cpf`, `password`, `role`, `departmentId`, `isActive`, `createdAt`, `updatedAt`) VALUES
(UUID(), 'Administrador do Sistema', 'admin@agildoc.com.br',    '000.000.000-00', '$2a$12$RiRBKS1Gh/6Mdl7Y1T1JkOdHu.eeoFJwILvy08YymwCoXfZHnxXmi', 'SUPER_ADMIN', @root_id,  1, NOW(), NOW()),
(UUID(), 'Maria Silva - Gestora',    'gestor@agildoc.com.br',   '111.111.111-11', '$2a$12$sY1Yi4znCGCZJ9VklA2DxOzueWSUoWysPOWWebYhVw5TD/rVx4Oh6',  'MANAGER',    @sadm_id,  1, NOW(), NOW()),
(UUID(), 'João Santos - Servidor',   'servidor@agildoc.com.br', '222.222.222-22', '$2a$12$jTp0gf09b/JeAGohQ6qACeJDPuk.qVy.1eIDA7eb0vmvI0jbmb052',  'OFFICER',    @gab_id,   1, NOW(), NOW());

-- ============================================================
-- FIM DO SCRIPT
-- Acesse com: admin@agildoc.com.br / Admin@123
-- IMPORTANTE: Altere as senhas após o primeiro login!
-- ============================================================
