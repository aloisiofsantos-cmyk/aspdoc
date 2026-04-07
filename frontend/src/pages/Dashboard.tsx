import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FolderOpen, CheckCircle, Clock, AlertTriangle,
  TrendingUp, Plus, ArrowRight, FileText,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { processApi, reportApi } from '../services/api';
import { StatCard } from '../components/ui/Card';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { InlineLoader } from '../components/ui/LoadingSpinner';
import { formatDateTime, formatRelative } from '../utils';
import { useAuth } from '../store/auth';
import { DashboardStats, Process } from '../types';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e', '#6b7280'];

export function DashboardPage() {
  const { user } = useAuth();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => processApi.dashboard().then(r => r.data.data as DashboardStats),
    refetchInterval: 60000,
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['reports', 'monthly'],
    queryFn: () => reportApi.monthly({ months: 6 }).then(r => r.data.data),
  });

  const stats = statsData;
  const hourOfDay = new Date().getHours();
  const greeting = hourOfDay < 12 ? 'Bom dia' : hourOfDay < 18 ? 'Boa tarde' : 'Boa noite';

  const statusChartData = stats?.byStatus?.map(item => ({
    name: {
      OPEN: 'Abertos',
      IN_PROGRESS: 'Em Andamento',
      PENDING: 'Pendentes',
      WAITING_SIGNATURE: 'Ag. Assinatura',
      COMPLETED: 'Concluídos',
      ARCHIVED: 'Arquivados',
      CANCELLED: 'Cancelados',
    }[item.status] || item.status,
    value: item._count.status,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Aqui está o resumo de hoje — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link to="/processos/novo">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Novo Processo
          </Button>
        </Link>
      </div>

      {statsLoading ? (
        <InlineLoader />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total de Processos"
              value={stats?.total || 0}
              icon={<FolderOpen className="h-6 w-6" />}
              color="blue"
            />
            <StatCard
              title="Em Andamento"
              value={(stats?.open || 0) + (stats?.inProgress || 0)}
              icon={<Clock className="h-6 w-6" />}
              color="yellow"
              subtitle={`${stats?.open || 0} abertos + ${stats?.inProgress || 0} em prog.`}
            />
            <StatCard
              title="Concluídos"
              value={stats?.completed || 0}
              icon={<CheckCircle className="h-6 w-6" />}
              color="green"
            />
            <StatCard
              title="Vencidos"
              value={stats?.overdue || 0}
              icon={<AlertTriangle className="h-6 w-6" />}
              color="red"
              subtitle="Prazo expirado"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Monthly evolution */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Evolução Mensal</h2>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
              {monthlyLoading ? (
                <InlineLoader />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="created" name="Abertos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Concluídos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status pie chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Por Status</h2>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </div>

          {/* Recent processes */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Processos Recentes</h2>
              <Link to="/processos" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {stats?.recentProcesses?.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhum processo encontrado</p>
                </div>
              ) : (
                stats?.recentProcesses?.slice(0, 8).map((process: Process) => (
                  <Link
                    key={process.id}
                    to={`/processos/${process.id}`}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500">{process.number}</span>
                        <StatusBadge status={process.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{process.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {process.creator?.name} • {formatRelative(process.createdAt)}
                      </p>
                    </div>
                    <PriorityBadge priority={process.priority} />
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
