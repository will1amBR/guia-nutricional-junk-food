import React from 'react'
import { Link } from 'react-router-dom'
import { Utensils } from 'lucide-react'

interface PublicLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#FFF9F2] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/login" className="flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#E55A2B] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl tracking-tight text-gray-900">
                Guia <span className="text-[#FF6B35]">JunkFood</span>
              </span>
              <span className="text-xs text-gray-500 font-medium tracking-wide">
                Equilíbrio & Sabor
              </span>
            </div>
          </Link>
          {title && (
            <h1 className="mt-6 text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          )}
          {subtitle && <p className="mt-1 text-sm text-gray-600 text-center">{subtitle}</p>}
        </div>

        {/* Card Body */}
        <div className="bg-white rounded-2xl shadow-xl shadow-orange-950/5 border border-orange-100/60 p-6 sm:p-8">
          {children}
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Orientações nutricionais baseadas em referências de saúde. Não substitui consulta médica.
        </p>
      </div>
    </div>
  )
}
