
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, GraduationCap, History, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/training', label: 'Training', icon: GraduationCap },
  { href: '/history', label: 'History', icon: History },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          // Highlight '/training' and its sub-pages when on Training tab
          const isActive = pathname.startsWith(item.href);
          
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="flex h-full flex-grow flex-col items-center justify-center gap-1 p-1 text-xs">
                <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("truncate transition-colors", isActive ? "font-semibold text-primary" : "text-muted-foreground")}>
                    {item.label}
                </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
