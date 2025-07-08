'use client'

import Link from 'next/link'
import { createClient } from '../../supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { 
  UserCircle, 
  Home, 
  CreditCard, 
  Crown, 
  Settings, 
  Menu, 
  X,
  FileText,
  BarChart3
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function DashboardNavbar() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Vue d\'ensemble'
    },
    {
      name: 'Transcribz',
      href: '/transcribe',
      icon: FileText,
      description: 'Créer une transcription'
    },
    {
      name: 'Transactions',
      href: '/dashboard/transactions',
      icon: CreditCard,
      description: 'Historique des paiements'
    },
    {
      name: 'Abonnement',
      href: '/dashboard/subscription',
      icon: Crown,
      description: 'Gérer l\'abonnement'
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      description: 'Statistiques d\'usage'
    },
    {
      name: 'Paramètres',
      href: '/dashboard/settings',
      icon: Settings,
      description: 'Configuration du compte'
    }
  ]

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4 relative z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" prefetch className="text-xl font-bold">
            UTCluj Transcripts
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* User Menu & Mobile Menu Button */}
        <div className="flex items-center gap-4">
          {/* Desktop User Menu */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={async () => {
                  await supabase.auth.signOut()
                  router.push("/")
                }}>
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-xs opacity-70">{item.description}</span>
                  </div>
                </Link>
              ))}
              
              {/* Mobile User Actions */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center gap-3 px-4 py-3">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Compte</span>
                </div>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push("/")
                    closeMenu()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
