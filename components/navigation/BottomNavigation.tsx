"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, FileText, Wrench, Settings } from 'lucide-react';
import { theme } from '@/lib/theme';

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
    },
    {
      href: '/saved',
      label: 'Saved',
      icon: Bookmark,
    },
    {
      href: '/cv',
      label: 'CV',
      icon: FileText,
    },
    {
      href: '/tools',
      label: 'Tools',
      icon: Wrench,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/jobs';
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{ 
        borderTopColor: theme.colors.border.DEFAULT,
        backgroundColor: theme.colors.background.DEFAULT 
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center 
                flex-1 h-full transition-colors duration-200
                ${active 
                  ? '' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <Icon
                size={24}
                className={`
                  mb-1 transition-colors duration-200
                  ${active 
                    ? '' 
                    : ''
                  }
                `}
                style={{
                  color: active 
                    ? theme.colors.primary.DEFAULT 
                    : theme.colors.text.secondary
                }}
              />
              <span
                className={`
                  text-xs font-medium transition-colors duration-200
                `}
                style={{
                  color: active 
                    ? theme.colors.primary.DEFAULT 
                    : theme.colors.text.secondary
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

