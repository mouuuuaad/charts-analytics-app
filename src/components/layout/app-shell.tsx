
'use client';

import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
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
import { Home, History, LogOut, BarChart3, Settings, UserCircle, GraduationCap, Newspaper, Loader2, PanelLeft } from 'lucide-react'; // Added PanelLeft
import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

const Logo = () => (
  <Link href="/dashboard" className="flex items-center gap-1.5 px-1.5 py-1" aria-label="ChartSight AI Home"> {/* Simplified padding/gap */}
     <BarChart3 className="h-6 w-6" /> {/* Simplified size, removed text-primary */}
    <h1 className="text-lg font-semibold group-data-[collapsible=icon]:hidden"> {/* Simplified */}
      ChartSight AI
    </h1>
  </Link>
);

const UserMenu = () => {
  const { user, logOut, loading } = useAuth();
  const router = useRouter();

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />; {/* Simplified */}
  if (!user) return <Button variant="outline" size="sm" onClick={() => router.push('/')}>Sign In</Button>; {/* Simplified */}

  const getInitials = (displayName: string | null | undefined, email: string | null | undefined) => {
    if (displayName) { const names = displayName.split(' '); if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase(); return displayName.substring(0, 2).toUpperCase(); }
    if (email) return email.substring(0, 2).toUpperCase(); return 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full"> {/* Simplified size */}
          <Avatar className="h-7 w-7"> {/* Simplified size */}
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
            <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end" forceMount> {/* Simplified width */}
        <DropdownMenuLabel className="font-normal p-1.5"> {/* Simplified padding */}
          <div className="flex flex-col space-y-0.5"> {/* Simplified spacing */}
            <p className="text-sm font-medium leading-none"> {user.displayName || 'User'} </p>
            {user.email && ( <p className="text-xs leading-none text-muted-foreground"> {user.email} </p> )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')} className="text-sm py-1 px-1.5"> {/* Simplified */}
          <UserCircle className="mr-1.5 h-3.5 w-3.5" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="text-sm py-1 px-1.5">
          <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings (Soon)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={async () => { await logOut(); }} className="text-sm py-1 px-1.5">
          <LogOut className="mr-1.5 h-3.5 w-3.5" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r"> {/* Removed dark mode specific border */}
        <SidebarHeader className="p-1"> {/* Simplified padding */}
          <Logo />
        </SidebarHeader>
        <SidebarContent className="p-1"> {/* Simplified padding */}
          <SidebarMenu className="gap-0.5"> {/* Simplified gap */}
            {[
              { href: '/dashboard', label: 'Dashboard', icon: Home, tooltip: 'Dashboard' },
              { href: '/news', label: 'News', icon: Newspaper, tooltip: 'Market News' },
              { href: '/history', label: 'History', icon: History, tooltip: 'Analysis History' },
              { href: '/training', label: 'Training', icon: GraduationCap, tooltip: 'Training & Quiz' },
              { href: '/profile', label: 'Profile', icon: UserCircle, tooltip: 'My Profile' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.tooltip} size="sm" className="h-8">
                    <Link href={item.href} legacyBehavior passHref>
                      <a> {/* Explicit <a> tag for legacyBehavior */}
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </a>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-1"> {/* Simplified padding */}
           {/* Footer can be empty or have a simple trigger */}
        </SidebarFooter>
      </Sidebar>
      <div className="flex min-h-svh flex-1 flex-col md:ml-[var(--sidebar-width-icon)] group-data-[state=expanded]:md:ml-[var(--sidebar-width)] transition-[margin-left] duration-150 ease-linear"> {/* Faster transition */}
         <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-2 border-b px-3 sm:px-4 py-1.5"> {/* Simplified */}
            <SidebarTrigger className="md:hidden h-7 w-7 p-0" /> {/* Simplified size */}
             <div className="md:hidden"> {/* Show logo on mobile header when sidebar is collapsed, similar to desktop icon view */}
                <Logo />
            </div>
            <div className="ml-auto"> <UserMenu /> </div>
        </header>
        <main className="flex-1 p-2 md:p-4"> {/* Simplified padding */}
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
