"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { theme } from '@/lib/theme';

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Hide bottom nav on job details pages and auth/onboarding pages
  const hideBottomNav = 
    (pathname?.startsWith('/jobs/') && pathname !== '/jobs') ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/dashboard');

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.colors.background.DEFAULT }}>
      {/* Main content with bottom padding for nav (unless hidden) */}
      <main 
        className="flex-1" 
        style={{ 
          backgroundColor: theme.colors.background.muted,
          paddingBottom: hideBottomNav ? '0' : '80px'
        }}
      >
        {children}
      </main>
      
      {/* Bottom Navigation - hidden on job details and auth pages */}
      {!hideBottomNav && <BottomNavigation />}
    </div>
  );
}

