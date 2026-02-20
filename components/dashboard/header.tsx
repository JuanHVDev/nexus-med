'use client'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import
{
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bell, LogOut, User } from 'lucide-react'
import { toast } from 'sonner'
interface HeaderProps
{
  user: {
    name: string
    email: string
    role?: string | null
  }
}
export function DashboardHeader({ user }: HeaderProps)
{
  const router = useRouter()
  const handleLogout = async () =>
  {
    try
    {
      await authClient.signOut()
      toast.success('Sesión cerrada')
      router.push('/login')
      router.refresh()
    } catch
    {
      toast.error('Error al cerrar sesión')
    }
  }
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-border/50 bg-background/60 backdrop-blur-md px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <span className="sr-only">Ver notificaciones</span>
            <Bell className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
          
          <div className="hidden lg:block lg:h-4 lg:w-px lg:bg-border/60" aria-hidden="true" />
          
          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary/20" aria-label="Menú de usuario">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-2 rounded-xl shadow-soft-elevated border-border/50 backdrop-blur-xl bg-background/95" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 py-1">
                  <p className="text-sm font-semibold leading-none">{user.name}</p>
                  <p className="text-[10px] leading-none text-muted-foreground font-mono mt-1 uppercase tracking-tight">
                    {user.role || 'USUARIO'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate opacity-70">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem className="rounded-lg m-1 cursor-pointer focus:bg-primary/5 focus:text-primary">
                <User className="mr-2 h-4 w-4" strokeWidth={1.5} />
                <span className="font-medium">Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg m-1 cursor-pointer focus:bg-destructive/5 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
                <span className="font-medium">Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}