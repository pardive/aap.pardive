// components/navigation/sidebar/LeftNavigationBar.tsx
'use client';

import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Wrench,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
  type CSSProperties,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Tooltip from '../../ui/Tooltip';
import { SidebarWrapper } from './index';

// ✅ registry + helper + types
import {
  MODULES,
  enabledModules,
  type ChildItem as ModuleChildItem,
  type ModuleNode,
} from '@/config/modules';
// ✅ shared user flags
import { useModuleFlags } from '@/components/hooks/useModuleFlags';

// local aliases
type ChildItem = ModuleChildItem;
type NavItem = { label: string; icon: LucideIcon; href?: string; children?: ChildItem[] };

type Props = {
  collapsed: boolean;
  setCollapsed: (v: boolean | ((c: boolean) => boolean)) => void;
  style?: CSSProperties;
};

const BRAND_BG = '#00332D';

function useMounted() {
  const [mounted, set] = useState(false);
  useEffect(() => set(true), []);
  return mounted;
}

type BrandVarStyle = React.CSSProperties & { ['--brand-bg']?: string };
const brandBg = (active: boolean): BrandVarStyle | undefined =>
  active ? { ['--brand-bg']: BRAND_BG } : undefined;

/* ------------------ Collapsed submenu ------------------ */
function CollapsedSubmenu({
  anchorEl,
  parentLabel,
  items,
  onRequestClose,
  onNavigate,
  scheduleClose,
  cancelClose,
  setEdgeSuppressed,
}: {
  anchorEl: HTMLElement;
  parentLabel: string;
  items: ChildItem[];
  onRequestClose: () => void;
  onNavigate: (href: string) => void;
  scheduleClose: (delay?: number) => void;
  cancelClose: () => void;
  setEdgeSuppressed: (b: boolean) => void;
}) {
  const mounted = useMounted();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; placement: 'right' | 'left' }>({
    top: -9999,
    left: -9999,
    placement: 'right',
  });

  const compute = useCallback(() => {
    if (!menuRef.current) return;
    if (!document.body.contains(anchorEl)) {
      onRequestClose();
      return;
    }
    const menuRect = menuRef.current.getBoundingClientRect();
    const r = anchorEl.getBoundingClientRect();

    let placement: 'right' | 'left' = 'right';
    let left = r.right;
    if (left + menuRect.width > window.innerWidth - 8) {
      placement = 'left';
      left = r.left - menuRect.width;
    }

    const maxTop = window.innerHeight - menuRect.height - 8;
    const top = Math.max(8, Math.min(r.top, maxTop));
    setPos({ top, left, placement });
    setReady(true);
  }, [anchorEl, onRequestClose]);

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(compute);
    return () => cancelAnimationFrame(raf);
  }, [compute]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onRequestClose();
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (anchorEl.contains(e.target as Node)) return;
      onRequestClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onRequestClose, anchorEl]);

  useEffect(() => {
    setEdgeSuppressed(true);
    return () => setEdgeSuppressed(false);
  }, [setEdgeSuppressed]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={parentLabel}
      className={clsx(
        'fixed z-[1000] min-w-[220px] rounded-lg border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-ui-navigationDark shadow-2xl overflow-hidden',
        ready ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={() => {
        cancelClose();
        setEdgeSuppressed(true);
      }}
      onMouseLeave={() => {
        scheduleClose(120);
        setEdgeSuppressed(false);
      }}
    >
      <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-ui-navigationDark border-b border-gray-200 dark:border-gray-700">
        {parentLabel}
      </div>
      <ul className="py-1">
        {items.map(({ label, href, icon: Icon }) => (
          <li key={href}>
            <button
              role="menuitem"
              onClick={() => onNavigate(href)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-[15px] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span className="truncate">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>,
    document.body
  );
}

/* ------------------ Edge Handle ------------------ */
function EdgeHandlePortal({
  anchorRef,
  collapsed,
  toggle,
  suppress,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  collapsed: boolean;
  toggle: () => void;
  suppress: boolean;
}) {
  const mounted = useMounted();
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const node = anchorRef.current;
    if (!node) return;

    const update = () => setRect(node.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);

    return () => ro.disconnect();
  }, [anchorRef]);

  if (!mounted || !rect) return null;

  return createPortal(
    <button
      type="button"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      onClick={toggle}
      style={{
        position: 'fixed',
        top: rect.top + rect.height / 2 - 16,
        left: rect.right - 6,
        width: 32,
        height: 32,
        zIndex: 1110,
      }}
      className={clsx(
        'rounded-full bg-white dark:bg-[#0f172a] shadow-sm',
        suppress && 'opacity-0 pointer-events-none'
      )}
    >
      {collapsed ? (
        <ChevronRight className="w-4 h-4 mx-auto text-emerald-900 dark:text-emerald-100" />
      ) : (
        <ChevronLeft className="w-4 h-4 mx-auto text-emerald-900 dark:text-emerald-100" />
      )}
    </button>,
    document.body
  );
}

/* ------------------ main component ------------------ */
export default function LeftNavigationBar({ collapsed, setCollapsed, style }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const { map: enabledMap } = useModuleFlags();
  const NAV_ITEMS: NavItem[] = useMemo(() => {
    const nodes: ModuleNode[] = enabledModules(MODULES, enabledMap);

    const items: NavItem[] = nodes.map((m) => ({
      label: m.label,
      icon: (m as any).icon as LucideIcon,
      href: (m as any).href,
      children: (m as any).children,
    }));

    items.forEach((item) => {
      if (item.children) {
        item.children.sort((a, b) => a.label.localeCompare(b.label));
      }
    });
    items.sort((a, b) => a.label.localeCompare(b.label));
    return items;
  }, [enabledMap]);

  const activeParentLabel = useMemo(() => {
    for (const item of NAV_ITEMS) {
      if (!item.children) continue;
      if (item.children.some((ch) => pathname.startsWith(ch.href))) {
        return item.label;
      }
    }
    return null;
  }, [pathname, NAV_ITEMS]);

  const [openMenu, setOpenMenu] = useState<string | null>(activeParentLabel);
  useEffect(() => setOpenMenu(activeParentLabel), [activeParentLabel]);

  const [popover, setPopover] = useState<{
    parentLabel: string;
    items: ChildItem[];
    anchorEl: HTMLElement;
  } | null>(null);
  const [edgeSuppressed, setEdgeSuppressed] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const scheduleClose = (delay = 120) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setPopover(null), delay);
  };
  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  const go = (href?: string) => href && router.push(href);

  return (
    <>
      <div ref={anchorRef} className="relative h-full" style={style}>
        <SidebarWrapper className="h-full">
          {/* Header */}
          <div className={clsx('mt-4', collapsed ? 'px-0' : 'px-3')}>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={clsx(
                'group w-full flex items-center rounded-md transition',
                collapsed ? 'justify-center' : 'justify-between px-3 py-2 hover:bg-gray-100'
              )}
            >
              {!collapsed && <span className="text-lg text-gray-700">Menu</span>}
              <Menu className="w-5 h-5 text-[#00332D]" />
            </button>
          </div>

          {/* Nav list */}
          <div className={clsx('flex-1 flex flex-col gap-1 py-2', collapsed ? 'items-center' : 'px-2')}>
            {NAV_ITEMS.map(({ label, icon: Icon, href, children }) => {
              const childActive = children?.some((ch) => pathname.startsWith(ch.href));
              const leafActive = href && pathname.startsWith(href);

              if (collapsed) {
                return (
                  <Tooltip key={label} label={label}>
                    <div
                      className="w-full flex justify-center"
                      onMouseEnter={(e) => {
                        if (children) {
                          cancelClose();
                          setPopover({ parentLabel: label, items: children, anchorEl: e.currentTarget as HTMLElement });
                        }
                      }}
                      onMouseLeave={() => children && scheduleClose(160)}
                    >
                      <button
                        onClick={() => go(href)}
                        className={clsx(
                          'w-11 h-11 rounded-md grid place-items-center transition-colors',
                          (childActive || leafActive)
                            ? 'bg-ui-darkButtonPrimaryBg text-white'
                            : 'text-[#00332D] hover:bg-gray-100'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    </div>
                  </Tooltip>
                );
              }

              if (children?.length) {
                const isOpen = openMenu === label;
                const parentActive = childActive || leafActive;
                return (
                  <div key={label} className="w-full">
                    <button
                      onClick={() => setOpenMenu((cur) => (cur === label ? null : label))}
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100',
                        parentActive && 'bg-gray-50'
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-[#00332D]" />
                        <span className="truncate">{label}</span>
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isOpen && (
                      <div className="mt-1 pl-8 flex flex-col gap-1">
                        {children.map(({ label: clabel, icon: CIcon, href: chref }) => {
                          const active = pathname.startsWith(chref);
                          return (
                            <button
                              key={chref}
                              onClick={() => go(chref)}
                              className={clsx(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left',
                                active
                                  ? 'bg-ui-darkButtonPrimaryBg text-white'
                                  : 'hover:bg-gray-100 text-gray-900'
                              )}
                            >
                              <CIcon className="w-5 h-5" />
                              <span className="truncate">{clabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={label}
                  onClick={() => go(href)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left',
                    leafActive ? 'bg-[#009966] text-white' : 'hover:bg-gray-100'
                  )}
                  style={brandBg(!!leafActive)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          {collapsed ? (
            <div className="mt-auto px-2 pb-2 pt-2">
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => router.push('/settings')}
                  className="w-11 h-11 grid place-items-center rounded-md hover:bg-gray-100"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <a
                  href="/workspace-manager"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 grid place-items-center rounded-md hover:bg-gray-100"
                >
                  <Wrench className="w-5 h-5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-auto px-2 pb-2 pt-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => router.push('/settings')}
                className="h-10 px-3 flex items-center gap-3 rounded-md hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm">Settings</span>
              </button>
              <a
                href="/workspace-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3 flex items-center justify-between rounded-md hover:bg-gray-100"
              >
                <span className="flex items-center gap-3">
                  <Wrench className="w-5 h-5" />
                  <span className="text-sm">Workspace Manager</span>
                </span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
            </div>
          )}
        </SidebarWrapper>
      </div>

      <EdgeHandlePortal
        anchorRef={anchorRef}
        collapsed={collapsed}
        toggle={() => setCollapsed((c) => !c)}
        suppress={edgeSuppressed}
      />
    </>
  );
}
