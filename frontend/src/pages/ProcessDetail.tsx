import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Download, Eye, Trash2, Send, CheckCircle, FileText,
  Clock, User, Building2, Tag, Upload, Plus, PenSquare, X,
} from 'lucide-react';
import { processApi, documentApi, departmentApi, userApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge, Badge } from '../components/ui/Badge';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Select, Textarea } from '../components/ui/Input';
import { InlineLoader } from '../components/ui/LoadingSpinner';
import {
  formatDateTime, formatRelative, formatFileSize, MOVEMENT_LABELS,
} from '../utils';
import { useAuth } from '../store/auth';
import { Process, Document, Movement } from '../types';
import toast from 'react-hot-toast';

export function ProcessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [forwardModal, setForwardModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [forwardDeptId, setForwardDeptId] = useState('');
  const [forwardObs, setForwardObs] = useState('');
  const [closeObs, setCloseObs] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['process', id],
    queryFn: () => processApi.get(id!).then(r => r.data.data as Process),
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.list().then(r => r.data.data),
  });

  const forwardMutation = useMutation({
    mutationFn: () => processApi.forward(id!, { toDeptId: forwardDeptId, observation: forwardObs }),
    onSuccess: () => {
      toast.success('Processo encaminhado!');
      setForwardModal(false);
      setForwardDeptId('');
      setForwardObs('');
      queryClient.invalidateQueries({ queryKey: ['process', id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao encaminhar'),
  });

  const closeMutation = useMutation({
    mutationFn: () => processApi.close(id!, closeObs),
    onSuccess: () => {
      toast.success('Processo concluído!');
      setCloseModal(false);
      queryClient.invalidateQueries({ queryKey: ['process', id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao concluir'),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('processId', id!);
      fd.append('name', file.name);
      return documentApi.upload(fd);
    },
    onSuccess: () => {
      toast.success('Documento enviado!');
      queryClient.invalidateQueries({ queryKey: ['process', id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao enviar documento'),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => documentApi.delete(docId),
    onSuccess: () => {
      toast.success('Documento removido');
      queryClient.invalidateQueries({ queryKey: ['process', id] });
    },
  });

  const requestSignatureMutation = useMutation({
    mutationFn: (documentId: string) => documentApi.requestSignature({
      documentId,
      type: 'ELECTRONIC',
      signerIds: [user!.id],
    }),
    onSuccess: () => {
      toast.success('Solicitação de assinatura enviada!');
      queryClient.invalidateQueries({ queryKey: ['process', id] });
    },
  });

  if (isLoading) return <InlineLoader />;
  if (!data) return <div>Processo não encontrado</div>;

  const process = data;
  const canEdit = process.status !== 'COMPLETED' && process.status !== 'ARCHIVED';
  const canClose = canEdit && ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '');

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 mt-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-lg">
              {process.number}
            </span>
            <StatusBadge status={process.status} />
            <PriorityBadge priority={process.priority} />
            {process.isConfidential && (
              <Badge variant="red">Sigiloso</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{process.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Aberto por {process.creator?.name} • {formatRelative(process.createdAt)}
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={() => setForwardModal(true)}
            >
              Encaminhar
            </Button>
            {canClose && (
              <Button
                variant="success"
                leftIcon={<CheckCircle className="h-4 w-4" />}
                onClick={() => setCloseModal(true)}
              >
                Concluir
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Details */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Detalhes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="text-sm font-medium text-gray-900">{process.type?.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Departamento</p>
                  <p className="text-sm font-medium text-gray-900">{process.department?.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Responsável</p>
                  <p className="text-sm font-medium text-gray-900">
                    {process.assignee?.name || 'Não atribuído'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Prazo</p>
                  <p className="text-sm font-medium text-gray-900">
                    {process.dueDate ? formatDateTime(process.dueDate) : 'Sem prazo'}
                  </p>
                </div>
              </div>
            </div>

            {process.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Descrição</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{process.description}</p>
              </div>
            )}

            {process.externalName && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Solicitante Externo</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">Nome:</span> {process.externalName}</div>
                  {process.externalCpf && <div><span className="text-gray-400">CPF:</span> {process.externalCpf}</div>}
                  {process.externalEmail && <div><span className="text-gray-400">Email:</span> {process.externalEmail}</div>}
                  {process.externalPhone && <div><span className="text-gray-400">Tel:</span> {process.externalPhone}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Documentos ({process.documents?.length || 0})
              </h2>
              {canEdit && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
                e.target.value = '';
              }}
            />

            {uploadMutation.isPending && (
              <div className="px-6 py-3 bg-blue-50 text-sm text-blue-700 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                Enviando documento...
              </div>
            )}

            <div className="divide-y divide-gray-50">
              {!process.documents?.length ? (
                <div className="py-10 text-center text-gray-400">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum documento</p>
                </div>
              ) : (
                process.documents.map((doc: Document) => (
                  <div key={doc.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50">
                    <FileText className="h-5 w-5 text-primary-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(doc.size)} • {formatRelative(doc.createdAt)}
                        {doc.isSigned && (
                          <span className="ml-2 text-green-600 font-medium">✓ Assinado</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={documentApi.view(doc.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={documentApi.download(doc.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      {!doc.isSigned && canEdit && (
                        <button
                          onClick={() => requestSignatureMutation.mutate(doc.id)}
                          className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                          title="Solicitar assinatura"
                        >
                          <PenSquare className="h-4 w-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => {
                            if (confirm('Remover este documento?')) {
                              deleteDocMutation.mutate(doc.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: movements */}
        <div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Tramitação</h2>
            </div>
            <div className="px-6 py-4">
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-4">
                  {process.movements?.map((mov: Movement) => (
                    <div key={mov.id} className="flex gap-3 relative">
                      <div className="w-6 h-6 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center flex-shrink-0 relative z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="text-xs font-medium text-gray-900">
                          {MOVEMENT_LABELS[mov.type]}
                        </p>
                        {mov.fromDept && (
                          <p className="text-xs text-gray-500">
                            De: {mov.fromDept?.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          por {mov.user?.name}
                        </p>
                        {mov.observation && (
                          <p className="text-xs text-gray-600 mt-1 italic">"{mov.observation}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{formatRelative(mov.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forward modal */}
      <Modal
        isOpen={forwardModal}
        onClose={() => setForwardModal(false)}
        title="Encaminhar Processo"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setForwardModal(false)}>Cancelar</Button>
            <Button
              onClick={() => forwardMutation.mutate()}
              loading={forwardMutation.isPending}
              disabled={!forwardDeptId}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Encaminhar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Encaminhar para"
            value={forwardDeptId}
            onChange={e => setForwardDeptId(e.target.value)}
            placeholder="Selecione o departamento..."
            required
          >
            {(deptsData || [])
              .filter((d: any) => d.id !== process.departmentId)
              .map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))
            }
          </Select>
          <Textarea
            label="Observação"
            placeholder="Descreva o motivo do encaminhamento..."
            value={forwardObs}
            onChange={e => setForwardObs(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>

      {/* Close modal */}
      <Modal
        isOpen={closeModal}
        onClose={() => setCloseModal(false)}
        title="Concluir Processo"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCloseModal(false)}>Cancelar</Button>
            <Button
              variant="success"
              onClick={() => closeMutation.mutate()}
              loading={closeMutation.isPending}
              leftIcon={<CheckCircle className="h-4 w-4" />}
            >
              Concluir
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">Tem certeza que deseja concluir este processo?</p>
          <Textarea
            label="Observação final (opcional)"
            placeholder="Descreva como o processo foi resolvido..."
            value={closeObs}
            onChange={e => setCloseObs(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
