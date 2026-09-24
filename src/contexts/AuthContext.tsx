import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserAuth, PerfilUsuario } from '@/types'
import { fetchUserProfile, saveUserProfile } from '@/services/nutrition'

interface AuthContextType {
  user: UserAuth | null
  profile: PerfilUsuario | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, pass: string) => Promise<void>
  signup: (name: string, email: string, pass: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  updateProfileData: (data: Partial<PerfilUsuario>) => Promise<PerfilUsuario>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAuth | null>(null)
  const [profile, setProfile] = useState<PerfilUsuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncCurrentUser = async () => {
    try {
      if (pb.authStore.isValid && pb.authStore.record) {
        const u = pb.authStore.record
        const currentUser: UserAuth = {
          id: u.id,
          email: u.email,
          name: u.name || (u.email ? u.email.split('@')[0] : 'Usuário'),
          avatar: u.avatar ? pb.files.getURL(u, u.avatar) : undefined,
        }
        setUser(currentUser)

        // Load profile
        const prof = await fetchUserProfile(currentUser.id)
        if (prof) {
          setProfile(prof)
        } else {
          // Initialize default profile if not yet created
          const defaultProf = await saveUserProfile(currentUser.id, {
            dieta_atual: ['Onivora'],
            restricoes: [],
            condicoes: ['Nenhuma'],
            meta_calorias: 2000,
            meta_proteina_pct: 25,
            meta_carboidrato_pct: 50,
            meta_gordura_pct: 25,
          })
          setProfile(defaultProf)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (err) {
      console.error('Erro ao sincronizar usuário:', err)
      setUser(null)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    syncCurrentUser()

    // Listen to pb auth changes
    const unsub = pb.authStore.onChange(() => {
      syncCurrentUser()
    })

    return () => {
      unsub()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email, pass)
    await syncCurrentUser()
  }

  const signup = async (name: string, email: string, pass: string) => {
    const createdUser = await pb.collection('users').create({
      name,
      email,
      password: pass,
      passwordConfirm: pass,
    })

    // create profile for new user
    await saveUserProfile(createdUser.id, {
      dieta_atual: ['Onivora'],
      restricoes: [],
      condicoes: ['Nenhuma'],
      meta_calorias: 2000,
      meta_proteina_pct: 25,
      meta_carboidrato_pct: 50,
      meta_gordura_pct: 25,
    })
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user?.id) {
      const prof = await fetchUserProfile(user.id)
      setProfile(prof)
    }
  }

  const updateProfileData = async (data: Partial<PerfilUsuario>) => {
    if (!user?.id) throw new Error('Usuário não autenticado')
    const updated = await saveUserProfile(user.id, data, profile?.id)
    setProfile(updated)
    return updated
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshProfile,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
