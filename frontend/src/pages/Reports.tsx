import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { reportApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { InlineLoader } from '../components/ui/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { formatDateTime } from '../utils';

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e', '#06b6d4', '#ec4899'];

const STATUS_PT: Record<string, string> = {
  OPEN: 'Abertos',
  IN_PROGRESS: 'Em Andamento',
  PENDING: 'Pendentes',
  WAITING_SIGNATURE: 'Ag. Assinatura',
  COMPLETED: 'Concluídos',
  ARCHIVED: 'Arquivados',
  CANCELLED: 'Cancelados',
};

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'overdue'>('overview');

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => reportApi.summary().then(r => r.data.data),
  });

  const { data: statusData } = useQuery({
    queryKey: ['reports', 'by-status'],
    queryFn: () => reportApi.byStatus().then(r => r.data.data),
  });

  const { data: typeData } = useQuery({
    queryKey: ['reports', 'by-type'],
    queryFn: () => reportApi.byType().then(r => r.data.data),
  });

  const { data: deptData } = useQuery({
    queryKey: ['reports', 'by-dept'],
    queryFn: () => reportApi.byDepartment().then(r => r.data.data),
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['reports', 'monthly'],
    queryFn: () => reportApi.monthly({ months: 6 }).then(r => r.data.data),
  });

  const { data: overdueData } = useQuery({
    queryKey: ['reports', 'overdue'],
    queryFn: () => reportApi.overdue().then(r => r.data.data),
    enabled: activeTab === 'overdue',
  });

  const statusChartData = (statusData || []).map((s: any) => ({
    name: STATUS_PT[s.status] || s.status,
    value: s._count.status,
  }));

  const typeChartData = (typeData || []).map((t: any) => ({
    name: t.typeName,
    count: t.count,
  }));

  const deptChartData = (deptData || []).slice(0, 8).map((d: any) => ({
    name: d.department?.name || '?',
    count: d.count,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 text-sm mt-1">Análises e estatísticas do sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'overview', label: 'Visão Geral' },
          { key: 'overdue', label: 'Vencidos' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <>
          {summaryLoading ? (
            <InlineLoader />
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total de Processos', value: summaryData?.totalProcesses || 0 },
                  { label: 'Abertos Hoje', value: summaryData?.totalToday || 0 },
                  { label: 'Abertos no Mês', value: summaryData?.totalThisMonth || 0 },
                  { label: 'Documentos', value: summaryData?.totalDocs || 0 },
                  { label: 'Usuários Ativos', value: summaryData?.totalUsers || 0 },
                  { label: 'Departamentos', value: summaryData?.totalDepts || 0 },
                  { label: 'Assinaturas Pendentes', value: summaryData?.pendingSignatures || 0 },
                ].map(item => (
                  <Card key={item.label} padding="md">
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{item.value}</p>
                  </Card>
                ))}
              </div>

              {/* Monthly chart */}
              <Card>
                <h2 className="font-semibold text-gray-900 mb-4">Evolução Mensal (últimos 6 meses)</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="created" name="Criados" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="completed" name="Concluídos" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* By status */}
                <Card>
                  <h2 className="font-semibold text-gray-900 mb-4">Por Status</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        outerRadius={80} paddingAngle={2}>
                        {statusChartData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* By type */}
                <Card>
                  <h2 className="font-semibold text-gray-900 mb-4">Por Tipo de Processo</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={typeChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Processos" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* By department */}
              <Card>
                <h2 className="font-semibold text-gray-900 mb-4">Por Departamento (Top 8)</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Processos" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}
        </>
      ) : (
        /* Overdue tab */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
            <h2 className="font-semibold text-red-900">
              Processos Vencidos ({overdueData?.length || 0})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Título</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Prazo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {(overdueData || []).map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-red-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[250px] truncate">{p.title}</td>
                    <td className="px-4 py-3 text-gray-500">{p.type?.name}</td>
                    <td className="px-4 py-3 text-red-600 text-xs">{formatDateTime(p.dueDate)}</td>
                    <td className="px-4 py-3 text-gray-500">{p.assignee?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!overdueData?.length && (
              <div className="py-12 text-center text-gray-400">Nenhum processo vencido</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
