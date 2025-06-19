
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
import { Home, History, LogOut, BarChart3, Settings, UserCircle, GraduationCap } from 'lucide-react'; // Added GraduationCap
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
  const { user, logOut } = useAuth(); // user will be null when auth is disabled
  const router = useRouter();

  // If auth is disabled, we might not want to show the user menu at all
  // or show a generic "Guest" or nothing. For now, let's return null.
  return null; 

  // Original UserMenu logic (kept for reference if re-enabled)
  // if (!user) return null; 

  // const getInitials = (email: string | null | undefined) => {
  //   if (!email) return 'U';
  //   return email.substring(0, 2).toUpperCase();
  // };

  // return (
  //   <DropdownMenu>
  //     <DropdownMenuTrigger asChild>
  //       <Button variant="ghost" className="relative h-10 w-10 rounded-full">
  //         <Avatar className="h-9 w-9">
  //           <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
  //           <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
  //         </Avatar>
  //       </Button>
  //     </DropdownMenuTrigger>
  //     <DropdownMenuContent className="w-56" align="end" forceMount>
  //       <DropdownMenuLabel className="font-normal">
  //         <div className="flex flex-col space-y-1">
  //           <p className="text-sm font-medium leading-none">
  //             {user.displayName || user.email}
  //           </p>
  //           <p className="text-xs leading-none text-muted-foreground">
  //             {user.email}
  //           </p>
  //         </div>
  //       </DropdownMenuLabel>
  //       <DropdownMenuSeparator />
  //       <DropdownMenuItem onClick={() => router.push('/')}> 
  //         <UserCircle className="mr-2 h-4 w-4" />
  //         Profile (Soon)
  //       </DropdownMenuItem>
  //       <DropdownMenuItem onClick={() => router.push('/')}>
  //         <Settings className="mr-2 h-4 w-4" />
  //         Settings (Soon)
  //       </DropdownMenuItem>
  //       <DropdownMenuSeparator />
  //       <DropdownMenuItem onClick={async () => {
  //         await logOut();
  //       }}>
  //         <LogOut className="mr-2 h-4 w-4" />
  //         Log out
  //       </DropdownMenuItem>
  //     </DropdownMenuContent>
  //   </DropdownMenu>
  // );
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // const { user, loading } = useAuth(); // Auth related logic can be simplified if auth is fully disabled
  // const router = useRouter(); 
  
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
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/training'}
                tooltip="Training"
              >
                <Link href="/training">
                  <GraduationCap />
                  <span>Training</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="items-center">
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

    