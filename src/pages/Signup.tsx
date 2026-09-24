import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PublicLayout } from '@/components/PublicLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: '', percent: 0 }
    let score = 0
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 1)
      return { label: 'Fraca', color: 'bg-red-500', textCol: 'text-red-600', percent: 25 }
    if (score <= 3)
      return { label: 'Média', color: 'bg-amber-500', textCol: 'text-amber-600', percent: 65 }
    return { label: 'Forte', color: 'bg-emerald-500', textCol: 'text-emerald-600', percent: 100 }
  }

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos.')
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      await signup(name, email, password)
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você já pode fazer login com suas credenciais.',
      })
      navigate('/app')
    } catch (err: unknown) {
      console.error('Signup error:', err)
      setError('Não foi possível criar a conta. Este email pode já estar em uso.')
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar',
        description: 'Verifique se os dados estão corretos ou tente outro email.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout title="Crie sua conta" subtitle="Monte seu plano de junk food inteligente">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            type="text"
            placeholder="Ex: Carlos Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            className="focus-visible:ring-[#FF6B35]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
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

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo de 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="pr-10 focus-visible:ring-[#FF6B35]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {password && (
            <div className="pt-1.5 space-y-1">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Força da senha:</span>
                <span className={`font-semibold ${strength.textCol}`}>{strength.label}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repita sua senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
            className="focus-visible:ring-[#FF6B35]"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-5 font-semibold text-base shadow-md shadow-orange-500/20 transition-all hover:scale-[1.01]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </Button>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors"
            >
              Faça login
            </Link>
          </p>
        </div>
      </form>
    </PublicLayout>
  )
}
