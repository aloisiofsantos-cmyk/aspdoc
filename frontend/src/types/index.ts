export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'OFFICER' | 'CITIZEN';

export type ProcessStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'WAITING_SIGNATURE'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type SignatureType = 'DIGITAL_CERT' | 'GOV_BR' | 'ELECTRONIC';
export type SignatureStatus = 'PENDING' | 'SIGNED' | 'REJECTED' | 'EXPIRED';
export type MovementType =
  | 'CREATED'
  | 'FORWARDED'
  | 'RETURNED'
  | 'SIGNED'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'COMMENTED'
  | 'REOPENED'
  | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
  departmentId?: string;
  department?: Department;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  parent?: Department;
  children?: Department[];
  isActive: boolean;
  createdAt: string;
  _count?: { users: number; processes: number };
}

export interface ProcessType {
  id: string;
  name: string;
  code: string;
  description?: string;
  requiresSignature: boolean;
  slaDays?: number;
  isPublic: boolean;
  isActive: boolean;
}

export interface Process {
  id: string;
  number: string;
  year: number;
  sequence: number;
  title: string;
  description?: string;
  status: ProcessStatus;
  priority: Priority;
  typeId: string;
  type: ProcessType;
  departmentId: string;
  department: Department;
  creatorId: string;
  creator: Pick<User, 'id' | 'name' | 'email'>;
  assigneeId?: string;
  assignee?: Pick<User, 'id' | 'name' | 'email'>;
  dueDate?: string;
  closedAt?: string;
  isConfidential: boolean;
  externalName?: string;
  externalCpf?: string;
  externalEmail?: string;
  externalPhone?: string;
  documents?: Document[];
  movements?: Movement[];
  tags?: { tag: string }[];
  _count?: { documents: number; movements: number };
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  processId: string;
  process?: { id: string; number: string; title: string };
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  hash?: string;
  isSigned: boolean;
  isMain: boolean;
  uploadedById: string;
  signatures?: Signature[];
  createdAt: string;
}

export interface Signature {
  id: string;
  documentId: string;
  document?: Document;
  userId: string;
  user: Pick<User, 'id' | 'name'>;
  type: SignatureType;
  status: SignatureStatus;
  hash?: string;
  requestedAt: string;
  signedAt?: string;
  expiresAt?: string;
  rejectedReason?: string;
}

export interface Movement {
  id: string;
  processId: string;
  fromDeptId?: string;
  fromDept?: Pick<Department, 'id' | 'name'>;
  toDeptId?: string;
  fromUserId?: string;
  toUserId?: string;
  userId: string;
  user: Pick<User, 'id' | 'name'>;
  observation?: string;
  type: MovementType;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  isRead: boolean;
  processId?: string;
  link?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byStatus: { status: ProcessStatus; _count: { status: number } }[];
  byType: { typeId: string; _count: { typeId: number } }[];
  recentProcesses: Process[];
}
