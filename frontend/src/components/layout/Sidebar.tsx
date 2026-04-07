import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, FolderOpen, PenSquare, BarChart3,
  Users, Building2, Settings, LogOut, ChevronDown, ChevronRight,
  Bell, FileSignature, Search, Shield,
} from 'lucide-react';
import { useAuth } from '../../store/auth';
import { isAdmin, isManager, cn } from '../../utils';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to?: string;
  children?: NavItem[];
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    to: '/dashboard',
  },
  {
    label: 'Processos',
    icon: <FolderOpen className="h-4 w-4" />,
    children: [
      { label: 'Todos os Processos', icon: <FileText className="h-4 w-4" />, to: '/processos' },
      { label: 'Novo Processo', icon: <PenSquare className="h-4 w-4" />, to: '/processos/novo' },
    ],
  },
  {
    label: 'Assinaturas',
    icon: <FileSignature className="h-4 w-4" />,
    to: '/assinaturas',
  },
  {
    label: 'Relatórios',
    icon: <BarChart3 className="h-4 w-4" />,
    to: '/relatorios',
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
  },
  {
    label: 'Administração',
    icon: <Shield className="h-4 w-4" />,
    roles: ['SUPER_ADMIN', 'ADMIN'],
    children: [
      { label: 'Usuários', icon: <Users className="h-4 w-4" />, to: '/admin/usuarios' },
      { label: 'Departamentos', icon: <Building2 className="h-4 w-4" />, to: '/admin/departamentos' },
      { label: 'Configurações', icon: <Settings className="h-4 w-4" />, to: '/admin/configuracoes' },
    ],
  },
];

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();

  if (item.roles && user && !item.roles.includes(user.role)) return null;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
            'text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors',
            depth > 0 && 'pl-6'
          )}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        {expanded && (
          <div className="ml-2 mt-0.5 space-y-0.5">
            {item.children.map((child) => (
              <NavItemComponent key={child.to} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to!}
      className={({ isActive }) => cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        depth > 0 && 'pl-7 text-xs',
        isActive
          ? 'bg-primary-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      {item.icon}
      {item.label}
    </NavLink>
  );
}

export function Sidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Sessão encerrada');
  };

  return (
    <aside className={cn(
      'flex flex-col bg-white border-r border-gray-200 h-full',
      mobile ? 'w-full' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">AgilDoc</h1>
          <p className="text-xs text-gray-400">Gestão Documental</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItemComponent key={item.to || item.label} item={item} />
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-700">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
