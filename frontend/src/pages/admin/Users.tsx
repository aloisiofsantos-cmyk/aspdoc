import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, UserX, Key, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { userApi, departmentApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { InlineLoader } from '../../components/ui/LoadingSpinner';
import { formatRelative, ROLE_LABELS } from '../../utils';
import { User, UserRole } from '../../types';
import toast from 'react-hot-toast';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => userApi.list({ search: search || undefined }).then(r => r.data.data),
    placeholderData: (p) => p,
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list().then(r => r.data.data),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (data: any) => editUser
      ? userApi.update(editUser.id, data)
      : userApi.create(data),
    onSuccess: () => {
      toast.success(editUser ? 'Usuário atualizado!' : 'Usuário criado! Senha enviada por email.');
      setShowModal(false);
      setEditUser(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao salvar'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => userApi.deactivate(id),
    onSuccess: () => {
      toast.success('Usuário desativado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => userApi.resetPassword(id),
    onSuccess: () => toast.success('Nova senha enviada por email'),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro'),
  });

  const openCreate = () => {
    setEditUser(null);
    reset();
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('role', user.role);
    setValue('departmentId', user.departmentId || '');
    setValue('phone', user.phone || '');
    setShowModal(true);
  };

  const users = data?.data || [];

  const roleColors: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    ADMIN: 'bg-orange-100 text-orange-800',
    MANAGER: 'bg-blue-100 text-blue-800',
    OFFICER: 'bg-gray-100 text-gray-700',
    CITIZEN: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total || 0} usuários cadastrados</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Novo Usuário
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <Input
          placeholder="Buscar por nome, email ou CPF..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <InlineLoader />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">CPF</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Perfil</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Departamento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Último Acesso</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: User) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-700">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.cpf}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {(u as any).department?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.lastLogin ? formatRelative(u.lastLogin) : 'Nunca'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => resetPasswordMutation.mutate(u.id)}
                        className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                        title="Redefinir senha"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      {u.isActive && (
                        <button
                          onClick={() => {
                            if (confirm(`Desativar ${u.name}?`)) deactivateMutation.mutate(u.id);
                          }}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                          title="Desativar"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditUser(null); reset(); }}
        title={editUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowModal(false); setEditUser(null); reset(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit(d => createMutation.mutate(d))} loading={createMutation.isPending}>
              {editUser ? 'Salvar' : 'Criar Usuário'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Nome Completo" error={errors.name?.message as string} required {...register('name', { required: 'Nome é obrigatório' })} />
          </div>
          <Input label="Email" type="email" error={errors.email?.message as string} required {...register('email', { required: 'Email é obrigatório' })} />
          {!editUser && (
            <Input label="CPF" placeholder="000.000.000-00" error={errors.cpf?.message as string} required {...register('cpf', { required: 'CPF é obrigatório' })} />
          )}
          <Input label="Telefone" placeholder="(00) 00000-0000" {...register('phone')} />
          <Select label="Perfil" required {...register('role', { required: true })}>
            <option value="">Selecione...</option>
            <option value="ADMIN">Administrador</option>
            <option value="MANAGER">Gestor</option>
            <option value="OFFICER">Servidor</option>
            <option value="CITIZEN">Cidadão</option>
          </Select>
          <Select label="Departamento" {...register('departmentId')}>
            <option value="">Nenhum</option>
            {(deptsData || []).map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
        {!editUser && (
          <p className="text-sm text-gray-500 mt-4 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Uma senha temporária será enviada por email ao usuário.
          </p>
        )}
      </Modal>
    </div>
  );
}
