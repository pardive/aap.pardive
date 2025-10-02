'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  UserPlus,
  Database,
  Bot,
  Table as TableIcon,
  LayoutTemplate,
  FileText,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

import CreateContactModal from '@/components/contact/CreateContactModal';
import type { Contact } from '@/types/contact';

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

type Item = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };

const RAW_ITEMS: Item[] = [
  { label: 'Agent',          href: '/ai-agents/create',            icon: Bot },
  { label: 'Contact',        href: '/contacts/create',             icon: UserPlus },
  { label: 'Data Extension', href: '/data-extension/create',       icon: Database },
  { label: 'Data Table',     href: '/dataextension/tables/create', icon: TableIcon },
  { label: 'Form',           href: '/forms/create',                icon: FileText },
  { label: 'Landing Page',   href: '/landingpages/create',         icon: LayoutTemplate },
];

// alphabetical, case-insensitive
const ITEMS = [...RAW_ITEMS].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

export default function GlobalCreateButton() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const hoverTimer = useRef<number | null>(null);
  const router = useRouter();

  const [openContactModal, setOpenContactModal] = useState(false); // ✅ contact modal state

  const computePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.right });
  };

  const openMenu = () => {
    computePos();
    setOpen(true);
  };
  const closeMenu = () => setOpen(false);

  const scheduleClose = (delay = 120) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOpen(false), delay) as unknown as number;
  };
  const cancelClose = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
  };

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (btnRef.current && (target === btnRef.current || btnRef.current.contains(target))) return;
      const menu = document.getElementById('global-create-menu');
      if (menu && (target === menu || menu.contains(target))) return;
      closeMenu();
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeMenu();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    computePos();
    const onRecompute = () => computePos();
    window.addEventListener('resize', onRecompute);
    window.addEventListener('scroll', onRecompute, true);
    return () => {
      window.removeEventListener('resize', onRecompute);
      window.removeEventListener('scroll', onRecompute, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? closeMenu() : openMenu())}
        onMouseEnter={() => {
          cancelClose();
          if (!open) openMenu();
        }}
        onMouseLeave={() => scheduleClose(160)}
        className={clsx(
          'w-9 h-9 grid place-items-center rounded-md transition-colors',
          'hover:bg-ui-hoverBG dark:hover:bg-ui-hoverBGDark',
          'text-[#00332D] dark:text-white'
        )}
        title="Create"
      >
        <Plus
          className={clsx(
            'w-7 h-7 transition-transform duration-200',
            open && 'rotate-45'
          )}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <Portal>
          <div
            id="global-create-menu"
            role="menu"
            aria-label="Create"
            onMouseEnter={cancelClose}
            onMouseLeave={() => scheduleClose(120)}
            className="fixed z-[1000] min-w-[220px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-ui-navigationDark shadow-2xl"
            style={{ top: pos.top, left: pos.left, transform: 'translateX(-100%)' }}
          >
            <div
              role="none"
              className="px-3 py-2 text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-ui-navigationDark border-b border-gray-200 dark:border-ui-borderDark"
            >
              Create
            </div>
            <ul className="py-1">
              {ITEMS.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <button
                    role="menuitem"
                    onClick={() => {
                      closeMenu();
                      if (label === 'Contact') {
                        setOpenContactModal(true); // ✅ open modal for Contact
                      } else {
                        router.push(href);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-[15px] font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Portal>
      )}

      {/* ✅ Contact Create Modal */}
      <CreateContactModal
        open={openContactModal}
        onOpenChange={setOpenContactModal}
        onCreated={(c: Contact) => {
          console.log('Created via GlobalCreateButton:', c);
          // TODO: refresh contacts list or show a toast
        }}
      />
    </>
  );
}
