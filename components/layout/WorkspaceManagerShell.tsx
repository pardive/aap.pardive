// components/layout/WorkspaceManagerShell.tsx
'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

import WorkspaceManagerNavBar from '@/components/navigation/sidebar/WorkspaceManagerNavBar';
import TopNavigationBar from '@/components/navigation/topnavigation/TopNavigationBar';

import {
  SIDEBAR_EXPANDED,
  SIDEBAR_COLLAPSED,
  HEADER_HEIGHT,
  GRID_GAP,
} from '@/lib/ui/constants';

type Crumb = { label: string; href: string };

const PERSIST_KEY = 'saltify-admin-collapsed'; // ✅ separate key for admin shell

export default function WorkspaceManagerShell({
  children,
  breadcrumbs,
}: {
  children: React.ReactNode;
  breadcrumbs?: Crumb[];
}) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(PERSIST_KEY) === '1';
    } catch {
      return false;
    }
  });

  const pathname = usePathname();

  useEffect(() => {
    try {
      if (collapsed) localStorage.setItem(PERSIST_KEY, '1');
      else localStorage.removeItem(PERSIST_KEY);
    } catch {}
  }, [collapsed]);

  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(PERSIST_KEY) === '1') setCollapsed(true);
    } catch {}
  }, []);

  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(PERSIST_KEY) === '1') setCollapsed(true);
    } catch {}
  }, [pathname]);

  const safeHeader =
    typeof HEADER_HEIGHT === 'number' ? `${HEADER_HEIGHT}px` : HEADER_HEIGHT || '64px';
  const safeGap = typeof GRID_GAP === 'number' ? `${GRID_GAP}px` : GRID_GAP || '8px';

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const safeSidebar =
    typeof sidebarWidth === 'number' ? `${sidebarWidth}px` : sidebarWidth || '220px';

  // Default: derive crumbs from URL. For /admin routes, you'll naturally get "Admin" first.
  const derivedBreadcrumbs: Crumb[] = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, arr) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: '/' + arr.slice(0, index + 1).join('/'),
    }));

  const crumbs = breadcrumbs ?? derivedBreadcrumbs;

  return (
    <div className="h-screen bg-gray-200 dark:bg-ui-appBgDark p-2">
      <div
        className="grid h-full"
        style={{
          gridTemplateColumns: `${safeSidebar} 1fr`,
          gridTemplateRows: `${safeHeader} minmax(0, 1fr)`,
          gap: safeGap,
          transition: 'grid-template-columns .2s ease',
        }}
      >
        {/* Logo (row 1, col 1) */}
        <div
          className={clsx(
            'rounded-md bg-[#00332D] grid place-items-center overflow-hidden h-full box-border'
          )}
          aria-label="Brand"
          title={collapsed ? 'Saltify (collapsed)' : 'Saltify'}
        >
          <Image
            src={collapsed ? '/logo/saltify-icon-trans/2.svg' : '/logo/logo-white.svg'}
            alt="Saltify"
            width={collapsed ? 28 : 120}
            height={28}
            className="object-contain"
            priority
          />
        </div>

        {/* Top nav (row 1, col 2) */}
        <div className="rounded-md overflow-hidden h-full box-border bg-white dark:bg-ui-pageDark shadow-sm">
          <TopNavigationBar />
        </div>

        {/* Sidebar (row 2, col 1) — Workspace Manager nav */}
        <div className="rounded-md overflow-hidden h-full">
          <WorkspaceManagerNavBar
            collapsed={collapsed}
            setCollapsed={setCollapsed}   // ✅ Option 1: pass the real setter
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Content (row 2, col 2) */}
        <main
          className={clsx(
            'bg-white dark:bg-ui-pageDark rounded-md p-4 h-full min-h-0',
            'shadow-sm overflow-auto'
          )}
        >
          <div className="mb-4">
            <nav aria-label="Breadcrumb" className="text-sm">
              <ol className="list-none p-0 m-0 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                {/* For admin shell, make "Home" point to /admin by default */}
                <li>
                  <Link href="/admin" className="hover:text-gray-900 dark:hover:text-white">
                    Admin
                  </Link>
                </li>
                {crumbs.map((item, idx) => {
                  const last = idx === crumbs.length - 1;
                  return (
                    <li key={item.href} className="flex items-center gap-2">
                      <span className="opacity-50">/</span>
                      {last ? (
                        <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
                      ) : (
                        <Link
                          href={item.href}
                          className="hover:text-gray-900 dark:hover:text-white"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
