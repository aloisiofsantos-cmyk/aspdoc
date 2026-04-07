import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PenSquare, FileText, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { documentApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { SignatureBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { InlineLoader } from '../components/ui/LoadingSpinner';
import { formatDateTime, formatRelative } from '../utils';
import { Signature } from '../types';
import toast from 'react-hot-toast';

export function SignaturesPage() {
  const queryClient = useQueryClient();
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signatureDrawn, setSignatureDrawn] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['pending-signatures'],
    queryFn: () => documentApi.pendingSignatures().then(r => r.data.data as Signature[]),
    refetchInterval: 30000,
  });

  const signMutation = useMutation({
    mutationFn: (signatureId: string) =>
      documentApi.sign(signatureId, `signed_electronically_${new Date().toISOString()}`),
    onSuccess: () => {
      toast.success('Documento assinado com sucesso!');
      setSigningId(null);
      queryClient.invalidateQueries({ queryKey: ['pending-signatures'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erro ao assinar'),
  });

  const signatures = data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assinaturas Pendentes</h1>
        <p className="text-gray-500 text-sm mt-1">
          {signatures.length} documento{signatures.length !== 1 ? 's' : ''} aguardando sua assinatura
        </p>
      </div>

      {isLoading ? (
        <InlineLoader />
      ) : signatures.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-3" />
          <p className="text-gray-500">Nenhum documento aguardando assinatura</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signatures.map((sig: any) => (
            <div
              key={sig.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
            >
              <div className="p-3 bg-blue-50 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {sig.document?.name}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Processo: <span className="font-mono">{sig.document?.process?.number}</span>
                  {' · '}{sig.document?.process?.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <SignatureBadge status={sig.status} />
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Solicitado {formatRelative(sig.requestedAt)}
                  </span>
                  {sig.expiresAt && (
                    <span className="text-xs text-orange-500">
                      Expira {formatDateTime(sig.expiresAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a
                  href={documentApi.view(sig.documentId)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    Visualizar
                  </Button>
                </a>
                <Button
                  size="sm"
                  leftIcon={<PenSquare className="h-3.5 w-3.5" />}
                  onClick={() => setSigningId(sig.id)}
                >
                  Assinar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signature modal */}
      <Modal
        isOpen={!!signingId}
        onClose={() => setSigningId(null)}
        title="Assinar Documento"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSigningId(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => signMutation.mutate(signingId!)}
              loading={signMutation.isPending}
              leftIcon={<PenSquare className="h-4 w-4" />}
            >
              Confirmar Assinatura
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Assinatura Eletrônica Simples</strong><br />
              Ao confirmar, você estará assinando eletronicamente este documento com seus dados de acesso ao AgilDoc.
              A assinatura será registrada com data/hora e identificação do signatário.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p>Declaro que li e concordo com o conteúdo do documento e que esta assinatura eletrônica tem validade jurídica nos termos da MP 2.200-2/2001 e da Lei 14.063/2020.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
