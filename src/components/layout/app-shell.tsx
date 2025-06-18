
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
  SidebarInset,
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
import { Home, History, LogOut, BarChart3, Settings, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

const Logo = () => (
  <Link href="/" className="flex items-center gap-2 px-2" aria-label="ChartSight AI Home">
     <BarChart3 className="h-8 w-8 text-primary" />
    <h1 className="text-xl font-headline font-semibold text-foreground group-data-[collapsible=icon]:hidden">
      ChartSight AI
    </h1>
  </Link>
);


const UserMenu = () => {
  const { user, logOut } = useAuth();
  const router = useRouter();

  if (!user) return null; // This will always be true now, so UserMenu won't render

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/')}> 
          <UserCircle className="mr-2 h-4 w-4" />
          Profile (Soon)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings (Soon)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth(); // user will be null, loading will be false
  // const router = useRouter(); // router might not be needed if redirection logic is removed

  // React.useEffect(() => {
  //   // This redirection logic is removed as auth is disabled
  //   // if (!loading && !user && pathname !== '/login' && pathname !== '/signup') {
  //   //   router.push('/login');
  //   // }
  // }, [user, loading, pathname, router]);


  // Since auth is disabled, we always show the shell or the auth pages themselves.
  // Loading state from useAuth is now always false.
  if (loading) { // This condition will likely never be true
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  // If on login/signup, and user is (theoretically) not authenticated (always true now), show the page.
  if (!user && (pathname === '/login' || pathname === '/signup')) {
    return <>{children}</>;
  }
  
  // For all other pages, show the AppShell with content.
  // User will be null, so UserMenu won't show.
  return (
    <SidebarProvider defaultOpen>
      <Sidebar
        variant="sidebar" 
        collapsible="icon" 
        className="border-r dark:border-neutral-700"
      >
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip="Dashboard"
              >
                <Link href="/">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/history'}
                tooltip="Analysis History"
              >
                <Link href="/history">
                  <History />
                  <span>Analysis History</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="items-center">
           {/* Can add footer items here if needed */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
            <SidebarTrigger className="md:hidden" />
            <div className="ml-auto">
                <UserMenu />
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Add a simple Loader2 component if not available globally
const Loader2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
