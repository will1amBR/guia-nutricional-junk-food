import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { PublicLayout } from '@/components/PublicLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await pb.collection('users').requestPasswordReset(email)
    } catch (err) {
      console.error('Password reset error:', err)
      // Even on failure, show general message to avoid email enumeration
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <PublicLayout
      title="Recuperar senha"
      subtitle="Informe seu email para receber as instruções de recuperação"
    >
      {submitted ? (
        <div className="space-y-6 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-lg">Verifique sua caixa de entrada</h3>
            <p className="text-sm text-gray-600">
              Se existir uma conta com este email, você receberá um link de recuperação.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#FF6B35] hover:text-[#E55A2B]"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email cadastrado</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="focus-visible:ring-[#FF6B35]"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-5 font-semibold text-base shadow-md shadow-orange-500/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando link...
              </>
            ) : (
              'Enviar link de recuperação'
            )}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </PublicLayout>
  )
}
