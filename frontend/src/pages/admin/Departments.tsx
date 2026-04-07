import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Edit, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { departmentApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { InlineLoader } from '../../components/ui/LoadingSpinner';
import { Department } from '../../types';
import toast from 'react-hot-toast';

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list().then(r => r.data.data),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<any>();

  const saveMutation = useMutation({
    mutationFn: (formData: any) => editDept
      ? departmentApi.update(editDept.id, formData)
      : departmentApi.create(formData),
    onSuccess: () => {
      toast.success(editDept ? 'Departamento atualizado!' : 'Departamento criado!');
      setShowModal(false);
      setEditDept(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao salvar'),
  });

  const openCreate = () => {
    setEditDept(null);
    reset();
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditDept(dept);
    setValue('name', dept.name);
    setValue('code', dept.code);
    setValue('description', dept.description || '');
    setValue('parentId', dept.parentId || '');
    setShowModal(true);
  };

  const departments: Department[] = data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departamentos</h1>
          <p className="text-gray-500 text-sm mt-1">{departments.length} departamentos cadastrados</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Novo Departamento
        </Button>
      </div>

      {isLoading ? (
        <InlineLoader />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Superior</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Usuários</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Processos</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept: any) => (
                <tr key={dept.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary-400" />
                      <span className="font-medium text-gray-900">{dept.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {dept.parent?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{dept._count?.users || 0}</td>
                  <td className="px-4 py-3 text-gray-500">{dept._count?.processes || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {dept.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(dept)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditDept(null); reset(); }}
        title={editDept ? 'Editar Departamento' : 'Novo Departamento'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowModal(false); setEditDept(null); reset(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit(d => saveMutation.mutate(d))} loading={saveMutation.isPending}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nome" required error={errors.name?.message as string} {...register('name', { required: 'Nome é obrigatório' })} />
          <Input
            label="Código"
            placeholder="Ex: SADM, GAB, RH"
            hint="Apenas letras maiúsculas, números e underscore"
            disabled={!!editDept}
            error={errors.code?.message as string}
            {...register('code', { required: !editDept, pattern: { value: /^[A-Z0-9_]+$/, message: 'Código inválido' } })}
          />
          <Textarea label="Descrição" rows={2} {...register('description')} />
          <Select label="Departamento Superior" {...register('parentId')}>
            <option value="">Nenhum (raiz)</option>
            {departments
              .filter(d => d.id !== editDept?.id)
              .map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))
            }
          </Select>
          {editDept && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" {...register('isActive')} className="rounded" />
              <label htmlFor="isActive" className="text-sm text-gray-700">Ativo</label>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
