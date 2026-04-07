import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, FileText, Shield } from 'lucide-react';
import { documentApi } from '../services/api';
import { formatDateTime } from '../utils';

export function VerifySignaturePage() {
  const { signatureId } = useParams<{ signatureId: string }>();
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    documentApi.verify(signatureId!)
      .then(r => setResult(r.data.data))
      .catch(() => setError('Assinatura não encontrada ou inválida'))
      .finally(() => setLoading(false));
  }, [signatureId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary-700 font-bold text-xl">
            <FileText className="h-6 w-6" />
            AgilDoc
          </div>
          <p className="text-gray-500 text-sm mt-1">Verificação de Assinatura Digital</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {loading ? (
            <div className="text-center py-8">
              <div className="h-10 w-10 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Verificando assinatura...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-900 mb-2">Assinatura Inválida</h2>
              <p className="text-gray-500">{error}</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                {result.valid ? (
                  <>
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-green-900">Assinatura Válida</h2>
                    <p className="text-gray-500 mt-1">Este documento foi assinado digitalmente e sua integridade está confirmada.</p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                      <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-red-900">Assinatura Inválida</h2>
                    <p className="text-gray-500 mt-1">Esta assinatura não pôde ser verificada.</p>
                  </>
                )}
              </div>

              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-400">Documento</p>
                  <p className="text-sm font-medium text-gray-900">{result.signature?.document?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Processo</p>
                  <p className="text-sm text-gray-700">
                    {result.signature?.document?.process?.number} — {result.signature?.document?.process?.title}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Assinado por</p>
                  <p className="text-sm font-medium text-gray-900">{result.signature?.signer?.name}</p>
                  {result.signature?.signer?.cpf && (
                    <p className="text-xs text-gray-500">CPF: {result.signature.signer.cpf}</p>
                  )}
                </div>
                {result.signature?.signedAt && (
                  <div>
                    <p className="text-xs text-gray-400">Data/Hora da Assinatura</p>
                    <p className="text-sm text-gray-700">{formatDateTime(result.signature.signedAt)}</p>
                  </div>
                )}
                {result.signature?.hash && (
                  <div>
                    <p className="text-xs text-gray-400">Hash de Integridade</p>
                    <p className="text-xs font-mono text-gray-600 break-all">{result.signature.hash}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <Shield className="h-3.5 w-3.5" />
                Verificação realizada por AgilDoc — Sistema de Gestão Documental
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
