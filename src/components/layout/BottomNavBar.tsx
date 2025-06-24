'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, GraduationCap, UserCircle, MessageSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/training', label: 'Training', icon: GraduationCap },
  { href: '/prayers', label: 'Prayers', icon: Clock },
  { href: '/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function BottomNavBar() {
  const pathname = usePathname();

  const navItemsWithActive = useMemo(() => 
    navItems.map(item => ({
      ...item,
      isActive: pathname.startsWith(item.href)
    })), 
    [pathname]
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block border-t border-border/20 bg-white/95 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center">
        {navItemsWithActive.map((item) => {
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              prefetch={true}
              className="flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors duration-200"
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors duration-200",
                item.isActive ? "text-primary" : "text-gray-500"
              )} />
              <span className={cn(
                "text-xs transition-colors duration-200",
                item.isActive ? "text-primary font-medium" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}