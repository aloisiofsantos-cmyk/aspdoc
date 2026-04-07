import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus, Search, Filter, Download, Eye, ArrowUpDown,
  FolderOpen, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { processApi, settingsApi, departmentApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { InlineLoader } from '../components/ui/LoadingSpinner';
import { formatDateTime, formatRelative, STATUS_LABELS, PRIORITY_LABELS } from '../utils';
import { Process, ProcessStatus, Priority } from '../types';

export function ProcessListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const typeId = searchParams.get('typeId') || '';
  const departmentId = searchParams.get('departmentId') || '';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['processes', { page, search, status, priority, typeId, departmentId }],
    queryFn: () => processApi.list({
      page, limit: 20,
      search: search || undefined,
      status: status || undefined,
      priority: priority || undefined,
      typeId: typeId || undefined,
      departmentId: departmentId || undefined,
    }).then(r => r.data.data),
    placeholderData: (prev) => prev,
  });

  const { data: typesData } = useQuery({
    queryKey: ['process-types'],
    queryFn: () => settingsApi.processTypes().then(r => r.data.data),
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list().then(r => r.data.data),
  });

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam('search', search);
  };

  const processes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} processo{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/processos/novo">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Novo Processo
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              placeholder="Buscar por número, título, CPF..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="flex-1"
            />
            <Button type="submit" variant="outline" size="md">
              Buscar
            </Button>
          </form>
          <Button
            variant="outline"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
            <Select
              label="Status"
              value={status}
              onChange={e => setParam('status', e.target.value)}
              placeholder="Todos"
            >
              {(Object.entries(STATUS_LABELS) as [ProcessStatus, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>

            <Select
              label="Prioridade"
              value={priority}
              onChange={e => setParam('priority', e.target.value)}
              placeholder="Todas"
            >
              {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>

            <Select
              label="Tipo"
              value={typeId}
              onChange={e => setParam('typeId', e.target.value)}
              placeholder="Todos"
            >
              {(typesData || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>

            <Select
              label="Departamento"
              value={departmentId}
              onChange={e => setParam('departmentId', e.target.value)}
              placeholder="Todos"
            >
              {(deptsData || []).map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <InlineLoader />
        ) : processes.length === 0 ? (
          <div className="py-16 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500">Nenhum processo encontrado</p>
            <Link to="/processos/novo" className="mt-2 inline-block text-sm text-primary-600 hover:underline">
              Criar primeiro processo
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Título</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Setor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Prioridade</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className={isFetching ? 'opacity-60' : ''}>
                {processes.map((process: Process) => (
                  <tr key={process.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {process.number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]" title={process.title}>
                        {process.title}
                      </p>
                      {process.externalName && (
                        <p className="text-xs text-gray-400">{process.externalName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{process.type?.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{process.department?.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={process.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={process.priority} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatRelative(process.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/processos/${process.id}`}>
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />}>
                          Ver
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {page} de {totalPages} ({total} resultados)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeft className="h-4 w-4" />}
                disabled={page <= 1}
                onClick={() => setParam('page', String(page - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight className="h-4 w-4" />}
                disabled={page >= totalPages}
                onClick={() => setParam('page', String(page + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
