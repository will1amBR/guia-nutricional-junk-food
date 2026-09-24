import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Utensils,
  Home,
  BookOpen,
  Sparkles,
  CalendarDays,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bot,
  BarChart3,
  Award,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const baseNavLinks = [
  { name: 'Início', path: '/app', icon: Home },
  { name: 'Catálogo', path: '/catalog', icon: BookOpen },
  { name: 'Recomendações', path: '/recommendations', icon: Sparkles },
  { name: 'Assistente', path: '/assistant', icon: Bot },
  { name: 'Minha Dieta', path: '/diet', icon: CalendarDays },
  { name: 'Relatório', path: '/report', icon: BarChart3 },
  { name: 'Conquistas', path: '/achievements', icon: Award },
  { name: 'Perfil', path: '/profile', icon: User },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = React.useMemo(() => {
    const links = [...baseNavLinks]
    if (user?.is_admin || user?.email === 'william@korenambiental.com') {
      links.push({ name: 'Admin', path: '/admin', icon: ShieldCheck })
    }
    return links
  }, [user])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitial = (name?: string) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F2] text-[#1F2937] font-sans antialiased selection:bg-[#FF6B35] selection:text-white">
      {/* Fixed Navbar with Blur & Shadow */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-md shadow-md border-b border-orange-100/50 py-3'
            : 'bg-white/95 backdrop-blur-sm border-b border-orange-100/30 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/app" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#E55A2B] flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none text-gray-900">
                Guia <span className="text-[#FF6B35]">JunkFood</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#2EC4B6] mt-0.5">
                Momento & Lugar
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive =
                link.path === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(link.path)

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-orange-50 text-[#FF6B35] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF6B35]' : 'text-gray-400'}`} />
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* User Avatar + Mobile Hamburger */}
          <div className="flex items-center gap-3">
            {/* User Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 p-1 rounded-full hover:bg-orange-50/80 transition-colors focus:outline-none">
                    <Avatar className="h-9 w-9 ring-2 ring-orange-200 ring-offset-1">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-[#FF6B35] text-white font-bold text-sm">
                        {getInitial(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-semibold text-gray-800 line-clamp-1 max-w-[120px]">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-gray-500 line-clamp-1 max-w-[120px]">
                        {user.email}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden lg:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 p-1 rounded-xl shadow-xl border-orange-100"
                >
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-gray-800">{user.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-orange-100/50" />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 py-2 text-sm text-gray-700"
                    >
                      <User className="w-4 h-4 text-[#FF6B35]" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/diet" className="flex items-center gap-2 py-2 text-sm text-gray-700">
                      <CalendarDays className="w-4 h-4 text-[#2EC4B6]" />
                      Minha Dieta
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-orange-100/50" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 flex items-center gap-2 py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Drawer */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-700 hover:bg-orange-50"
                    aria-label="Abrir menu"
                  >
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[280px] sm:w-[320px] bg-white p-6 flex flex-col justify-between"
                >
                  <div>
                    <SheetHeader className="text-left pb-6 border-b border-orange-100">
                      <SheetTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-lg text-gray-900">
                          Guia <span className="text-[#FF6B35]">JunkFood</span>
                        </span>
                      </SheetTitle>
                    </SheetHeader>

                    {/* Mobile Links */}
                    <nav className="flex flex-col gap-1.5 mt-6">
                      {navLinks.map((link) => {
                        const Icon = link.icon
                        const isActive =
                          link.path === '/app'
                            ? location.pathname === '/app'
                            : location.pathname.startsWith(link.path)
                        return (
                          <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                              isActive
                                ? 'bg-orange-50 text-[#FF6B35]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${isActive ? 'text-[#FF6B35]' : 'text-gray-400'}`}
                            />
                            {link.name}
                          </Link>
                        )
                      })}
                    </nav>
                  </div>

                  {/* Mobile Footer & Logout */}
                  <div className="pt-6 border-t border-orange-100 space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sair da Conta
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-opacity duration-200">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white">
                <Utensils className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-gray-900">
                  Guia <span className="text-[#FF6B35]">JunkFood</span>
                </span>
                <span className="text-xs text-gray-500">
                  Coma o que você ama com estratégia nutricional.
                </span>
              </div>
            </div>

            <div className="text-center md:text-right max-w-xl">
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-700">Aviso legal:</strong> As orientações e pontuações
                geradas por este aplicativo têm fins educativos e não substituem o aconselhamento,
                diagnóstico ou tratamento de médicos ou nutricionistas.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                © {new Date().getFullYear()} Guia Nutricional de Junk Food. Todos os direitos
                reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
