import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { PublicLayout } from '@/components/PublicLayout'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    pb.collection('users')
      .confirmEmailChange(token, '')
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <PublicLayout title="Alteração de Email">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin mb-4" />
          <p className="text-gray-600">Confirmando a alteração de email...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900">Email alterado com sucesso!</h3>
            <p className="text-sm text-gray-600">Faça login com seu novo email para continuar.</p>
          </div>
          <Button asChild className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-5">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center space-y-5">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900">Falha ao confirmar</h3>
            <p className="text-sm text-gray-600">O link é inválido ou já expirou.</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Voltar para o login</Link>
          </Button>
        </div>
      )}
    </PublicLayout>
  )
}
