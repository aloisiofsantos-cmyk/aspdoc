import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Upload, X, FileText, Plus, ArrowLeft } from 'lucide-react';
import { processApi, documentApi, settingsApi, departmentApi, userApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { formatFileSize } from '../utils';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(5, 'Título deve ter ao menos 5 caracteres'),
  description: z.string().optional(),
  typeId: z.string().min(1, 'Selecione o tipo'),
  departmentId: z.string().min(1, 'Selecione o departamento'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
  isConfidential: z.boolean().default(false),
  assigneeId: z.string().optional(),
  externalName: z.string().optional(),
  externalCpf: z.string().optional(),
  externalEmail: z.string().email().optional().or(z.literal('')),
  externalPhone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ProcessNewPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isExternal, setIsExternal] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'NORMAL', isConfidential: false },
  });

  const selectedDeptId = watch('departmentId');

  const { data: typesData } = useQuery({
    queryKey: ['process-types'],
    queryFn: () => settingsApi.processTypes().then(r => r.data.data),
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list().then(r => r.data.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-by-dept', selectedDeptId],
    queryFn: () => userApi.list({ departmentId: selectedDeptId, isActive: 'true' }).then(r => r.data.data?.data),
    enabled: !!selectedDeptId,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await processApi.create(formData as unknown as Record<string, unknown>);
      const processId = data.data.id;

      // Upload files
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('processId', processId);
        fd.append('name', file.name);
        await documentApi.upload(fd);
      }

      return data.data;
    },
    onSuccess: (process) => {
      toast.success(`Processo ${process.number} criado com sucesso!`);
      navigate(`/processos/${process.id}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao criar processo');
    },
  });

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Processo</h1>
          <p className="text-gray-500 text-sm">Preencha os dados para abrir um novo protocolo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-6">
        {/* Basic info */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Informações do Processo</h2>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Título / Assunto"
              placeholder="Descreva o assunto do processo"
              error={errors.title?.message}
              required
              {...register('title')}
            />

            <Textarea
              label="Descrição Detalhada"
              placeholder="Descreva detalhadamente o processo..."
              rows={3}
              {...register('description')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Tipo de Processo"
                error={errors.typeId?.message}
                required
                placeholder="Selecione..."
                {...register('typeId')}
              >
                {(typesData || []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>

              <Select
                label="Departamento Destino"
                error={errors.departmentId?.message}
                required
                placeholder="Selecione..."
                {...register('departmentId')}
              >
                {(deptsData || []).map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>

              <Select
                label="Prioridade"
                {...register('priority')}
              >
                <option value="LOW">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </Select>

              <Input
                label="Prazo (opcional)"
                type="date"
                {...register('dueDate')}
              />

              {selectedDeptId && (
                <Select
                  label="Responsável (opcional)"
                  placeholder="Selecionar servidor..."
                  {...register('assigneeId')}
                >
                  {(usersData || []).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </Select>
              )}

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isConfidential"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register('isConfidential')}
                />
                <label htmlFor="isConfidential" className="text-sm text-gray-700">
                  Processo Sigiloso
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* External requester */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Solicitante Externo</h2>
            <button
              type="button"
              onClick={() => setIsExternal(!isExternal)}
              className="text-sm text-primary-600 hover:underline"
            >
              {isExternal ? 'Remover' : 'Adicionar solicitante'}
            </button>
          </div>

          {isExternal && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                placeholder="Nome do solicitante"
                {...register('externalName')}
              />
              <Input
                label="CPF"
                placeholder="000.000.000-00"
                {...register('externalCpf')}
              />
              <Input
                label="Email"
                type="email"
                placeholder="email@exemplo.com"
                error={errors.externalEmail?.message}
                {...register('externalEmail')}
              />
              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                {...register('externalPhone')}
              />
            </div>
          )}

          {!isExternal && (
            <p className="text-sm text-gray-400 italic">Nenhum solicitante externo adicionado</p>
          )}
        </Card>

        {/* Documents */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Documentos</h2>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar arquivo
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleFileAdd}
          />

          {files.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all"
            >
              <Upload className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Clique ou arraste arquivos aqui</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG até 50MB</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <FileText className="h-5 w-5 text-primary-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 text-sm text-primary-600 hover:underline"
              >
                + Adicionar mais arquivos
              </button>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Abrir Processo
          </Button>
        </div>
      </form>
    </div>
  );
}
