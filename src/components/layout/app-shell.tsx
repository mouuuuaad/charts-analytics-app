'use client';

import Link from 'next/link';
import React, { useMemo, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home,
  LogOut,
  BarChart3,
  UserCircle,
  GraduationCap,
  Newspaper,
  Loader2,
  Settings,
  MessageSquare,
  ShieldCheck,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { BottomNavBar } from './BottomNavBar';
import { ADMIN_EMAIL } from '@/types';

// Optimized Logo component with better performance
const Logo = React.memo(() => (
  <Link 
    href="/dashboard" 
    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
    prefetch={true}
  >
    <div className="relative">
      <BarChart3 className="h-7 w-7 text-primary transition-transform duration-200 group-hover:scale-110" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
    <div className="group-data-[collapsible=icon]:hidden">
      <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        Oday AI
      </h1>
      <p className="text-xs text-muted-foreground -mt-1">Intelligence Platform</p>
    </div>
  </Link>
));

// Optimized UserMenu with better loading states
const UserMenu = React.memo(() => {
  const { user, logOut, loading } = useAuth();
  const router = useRouter();

  const handleSignIn = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleLogOut = useCallback(async () => {
    await logOut();
  }, [logOut]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-10 h-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSignIn}
        className="hover:bg-primary hover:text-white transition-all duration-200"
      >
        Sign In
      </Button>
    );
  }

  const getInitials = (displayName?: string | null, email?: string | null) => {
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length > 1)
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      return displayName.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.photoURL || undefined}
              alt={user.displayName || user.email || 'User'}
            />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-sm font-semibold">
              {getInitials(user.displayName, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2" align="end" sideOffset={5}>
        <DropdownMenuLabel className="font-normal p-3 bg-accent/30 rounded-lg mb-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{user.displayName || 'User'}</p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        
        <div className="space-y-1">
          <Link href="/profile" prefetch={true}>
            <DropdownMenuItem className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200">
              <UserCircle className="h-4 w-4 text-primary" />
              <span>Profile</span>
              <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
            </DropdownMenuItem>
          </Link>
          
          <Link href="/settings" prefetch={true}>
            <DropdownMenuItem className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200">
              <Settings className="h-4 w-4 text-primary" />
              <span>Settings</span>
              <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
            </DropdownMenuItem>
          </Link>
          
          {user.email === ADMIN_EMAIL && (
            <Link href="/admin" prefetch={true}>
              <DropdownMenuItem className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200 bg-primary/10">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">Admin Panel</span>
                <ChevronRight className="h-3 w-3 ml-auto text-primary" />
              </DropdownMenuItem>
            </Link>
          )}
        </div>
        
        <DropdownMenuSeparator className="my-2" />
        
        <DropdownMenuItem
          className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
          onClick={handleLogOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// Optimized Navigation Item component
const NavItem = React.memo(({ href, label, icon: Icon, tooltip, isActive }: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  isActive: boolean;
}) => (
  <SidebarMenuItem>
    <Link 
      href={href} 
      prefetch={true}
      className={`
        flex items-center gap-3 h-11 px-4 rounded-xl transition-all duration-200 group relative overflow-hidden
        ${isActive 
          ? 'bg-primary text-white shadow-lg shadow-primary/25' 
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }
      `}
      title={tooltip}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 -z-10" />
      )}
      <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
      <span className="font-medium group-data-[collapsible=icon]:hidden">{label}</span>
      {isActive && (
        <div className="ml-auto w-2 h-2 bg-white rounded-full group-data-[collapsible=icon]:hidden" />
      )}
    </Link>
  </SidebarMenuItem>
));

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = useMemo(
    () => [
      { href: '/dashboard', label: 'Dashboard', icon: Home, tooltip: 'Main Dashboard' },
      { href: '/news', label: 'News', icon: Newspaper, tooltip: 'Latest Market News' },
      { href: '/training', label: 'Training', icon: GraduationCap, tooltip: 'Learning Center' },
      { href: '/prayers', label: 'Prayers', icon: Clock, tooltip: 'Prayer Schedule' },
      { href: '/feedback', label: 'Feedback', icon: MessageSquare, tooltip: 'Community Feedback' },
      { href: '/profile', label: 'Profile', icon: UserCircle, tooltip: 'User Profile' },
    ],
    []
  );

  return (
    <SidebarProvider defaultOpen>
      <Sidebar 
        variant="sidebar" 
        collapsible="icon" 
        className="border-r border-border/50 bg-card/50 backdrop-blur-sm"
      >
        <SidebarHeader className="p-4 border-b border-border/50">
          <Logo />
        </SidebarHeader>
        
        <SidebarContent className="p-4">
          <SidebarMenu className="space-y-2">
            {navItems.map(({ href, label, icon, tooltip }) => {
              const isActive = pathname.startsWith(href);
              return (
                <NavItem
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  tooltip={tooltip}
                  isActive={isActive}
                />
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-4 border-t border-border/50">
          {user?.email === ADMIN_EMAIL && (
            <SidebarMenu>
              <SidebarMenuItem>
                <Link 
                  href="/admin" 
                  prefetch={true}
                  className="flex items-center gap-3 h-11 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 group"
                >
                  <ShieldCheck className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
                  <span className="font-semibold group-data-[collapsible=icon]:hidden">Admin Panel</span>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
      </Sidebar>
      
      <div className="flex min-h-screen flex-1 flex-col md:ml-[var(--sidebar-width-icon)] 
        group-data-[state=expanded]:md:ml-[var(--sidebar-width)] transition-[margin-left] 
        duration-300 ease-out pb-16 md:pb-0 bg-background">
        
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 
          border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 py-2">
          <div className="md:hidden">
            <Logo />
          </div>
          <div className="ml-auto">
            <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        
        <footer className="py-6 text-center border-t border-border/50 bg-card/30">
          <p className="text-sm text-muted-foreground">
            Created with ❤️ by{' '}
            <span className="font-semibold text-primary">Mouaad Idoufkir</span>
          </p>
        </footer>
        
        <BottomNavBar />
      </div>
    </SidebarProvider>
  );
}