'use client';

import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Sun, Moon, Monitor, SlidersHorizontal, Clock,
  Bell, Plus, User, Search, Home, Settings, Table2, Bot, Users2, FileText, LineChart
} from 'lucide-react';

/* ======================= MODE (exclusive) ======================= */
type ThemeMode = 'light' | 'dark' | 'system' | 'auto' | 'custom';
const THEME_STORAGE = 'ui:themeMode';

function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else if (mode === 'light') root.classList.remove('dark');
  else if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else if (mode === 'auto') {
    const h = new Date().getHours();
    const dark = h < 7 || h >= 19; // night = dark
    root.classList.toggle('dark', dark);
  }
  root.setAttribute('data-theme-mode', mode);
}

/* ======================= CUSTOM THEME MODEL ======================= */
type Density = 'compact' | 'comfortable' | 'spacious';
type CustomTheme = {
  accent: string;
  background: string;
  foreground: string; // text
  card: string;
  radius: number;
  density: Density;
  font: string;
  // buttons
  btnPrimaryBg: string;
  btnPrimaryFg: string;
  btnSecondaryBg: string;
  btnSecondaryFg: string;
};
const CUSTOM_STORAGE = 'ui:theme:custom';

const DEFAULTS: CustomTheme = {
  accent: '#16A34A',
  background: '#0B1020',
  foreground: '#F8FAFC',
  card: '#111827',
  radius: 12,
  density: 'comfortable',
  font:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',

  btnPrimaryBg: '#16A34A',
  btnPrimaryFg: '#0A1216',
  btnSecondaryBg: '#1F2937',
  btnSecondaryFg: '#E5E7EB',
};

function applyVars(t: CustomTheme) {
  const r = document.documentElement;
  r.style.setProperty('--accent-hex', t.accent);
  r.style.setProperty('--background-hex', t.background);
  r.style.setProperty('--foreground-hex', t.foreground);
  r.style.setProperty('--card-hex', t.card);
  r.style.setProperty('--radius', `${t.radius}px`);
  r.style.setProperty(
    '--density-scale',
    String(t.density === 'compact' ? 0.9 : t.density === 'spacious' ? 1.15 : 1),
  );
  r.style.setProperty('--font-family', t.font);
  r.style.setProperty('--btn-primary-bg', t.btnPrimaryBg);
  r.style.setProperty('--btn-primary-fg', t.btnPrimaryFg);
  r.style.setProperty('--btn-secondary-bg', t.btnSecondaryBg);
  r.style.setProperty('--btn-secondary-fg', t.btnSecondaryFg);
  document.body.style.fontFamily = 'var(--font-family)';
}

function loadCustom(): CustomTheme {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/* ======================= LUMINANCE HELPERS (auto dark for custom) ======================= */
function hexToRGB(hex: string) {
  const m = hex.replace('#', '');
  const v =
    m.length === 3
      ? m.split('').map((c) => parseInt(c + c, 16))
      : [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
  return { r: v[0], g: v[1], b: v[2] };
}
function relLuminance(hex: string) {
  const { r, g, b } = hexToRGB(hex);
  const norm = (x: number) => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = norm(r), G = norm(g), B = norm(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function setDarkClassFromBg(bgHex: string) {
  const isDark = relLuminance(bgHex) < 0.5;
  document.documentElement.classList.toggle('dark', isDark);
}

/* ======================= PRESETS (brand + mixed light/dark) ======================= */
type Preset = { name: string; theme: 'light' | 'dark'; t: Partial<CustomTheme> };
const PRESETS: Preset[] = [
  // Brand
  {
    name: 'Saltify Light',
    theme: 'light',
    t: {
      accent: '#16A34A',
      background: '#F7F8FB',
      foreground: '#0B1220',
      card: '#FFFFFF',
      btnPrimaryBg: '#16A34A',
      btnPrimaryFg: '#FFFFFF',
      btnSecondaryBg: '#E6EAF2',
      btnSecondaryFg: '#0B1220',
    },
  },
  {
    name: 'Saltify Dark',
    theme: 'dark',
    t: {
      accent: '#16A34A',
      background: '#0B1020',
      foreground: '#F8FAFC',
      card: '#111827',
      btnPrimaryBg: '#16A34A',
      btnPrimaryFg: '#0A1216',
      btnSecondaryBg: '#1F2937',
      btnSecondaryFg: '#E5E7EB',
    },
  },
  // Colorways
  {
    name: 'Indigo Light',
    theme: 'light',
    t: {
      accent: '#4F46E5',
      background: '#F8FAFF',
      foreground: '#0B0C14',
      card: '#FFFFFF',
      btnPrimaryBg: '#4F46E5',
      btnPrimaryFg: '#FFFFFF',
      btnSecondaryBg: '#EEF1FF',
      btnSecondaryFg: '#0B0C14',
    },
  },
  {
    name: 'Amber Light',
    theme: 'light',
    t: {
      accent: '#F59E0B',
      background: '#FFFDF7',
      foreground: '#1A1405',
      card: '#FFFFFF',
      btnPrimaryBg: '#F59E0B',
      btnPrimaryFg: '#1A1405',
      btnSecondaryBg: '#FFECC7',
      btnSecondaryFg: '#1A1405',
    },
  },
  {
    name: 'Emerald Dark',
    theme: 'dark',
    t: {
      accent: '#10B981',
      background: '#0B1020',
      foreground: '#F8FAFC',
      card: '#121A2E',
      btnPrimaryBg: '#10B981',
      btnPrimaryFg: '#071019',
      btnSecondaryBg: '#1F2937',
      btnSecondaryFg: '#E5E7EB',
    },
  },
  {
    name: 'Rose Dark',
    theme: 'dark',
    t: {
      accent: '#FB7185',
      background: '#1A0F13',
      foreground: '#FFEFF2',
      card: '#27161C',
      btnPrimaryBg: '#FB7185',
      btnPrimaryFg: '#22080C',
      btnSecondaryBg: '#372028',
      btnSecondaryFg: '#FFE3E9',
    },
  },
  {
    name: 'Slate Light',
    theme: 'light',
    t: {
      accent: '#64748B',
      background: '#F6F8FB',
      foreground: '#0B0E12',
      card: '#FFFFFF',
      btnPrimaryBg: '#64748B',
      btnPrimaryFg: '#FFFFFF',
      btnSecondaryBg: '#E6ECF3',
      btnSecondaryFg: '#0B0E12',
    },
  },
];

/* ======================= MODE TOGGLE ======================= */
function ThemeModeToggle({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (m: ThemeMode) => void;
}) {
  const modes: Array<{ key: ThemeMode; icon: React.ElementType; title: string }> = [
    { key: 'light', icon: Sun, title: 'Light' },
    { key: 'dark', icon: Moon, title: 'Dark' },
    { key: 'system', icon: Monitor, title: 'System' },
    { key: 'auto', icon: Clock, title: 'Auto' },
    { key: 'custom', icon: SlidersHorizontal, title: 'Custom' },
  ];
  return (
    <div className="inline-flex rounded-full border bg-background p-1 shadow-sm">
      {modes.map(({ key, icon: Icon, title }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            title={title}
            aria-pressed={active}
            className={clsx(
              'h-9 w-9 lg:w-auto lg:px-3 rounded-full flex items-center justify-center gap-2 text-sm transition',
              active ? 'bg-foreground/90 text-background border border-foreground/90' : 'hover:bg-muted/60',
            )}
            onClick={() => onChange(key)}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden lg:inline">{title}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ======================= PREVIEW DEVICE ======================= */
type Device = 'desktop' | 'tablet' | 'mobile';

function DeviceToggle({
  value, onChange,
}: {
  value: Device;
  onChange: (d: Device) => void;
}) {
  const items: Array<{ k: Device; label: string }> = [
    { k: 'desktop', label: 'Desktop' },
    { k: 'tablet', label: 'Tablet' },
    { k: 'mobile', label: 'Mobile' },
  ];
  return (
    <div className="inline-flex rounded-full border bg-background p-1 shadow-sm">
      {items.map(({ k, label }) => {
        const active = value === k;
        return (
          <button
            key={k}
            className={clsx(
              'h-8 px-3 rounded-full text-xs',
              active ? 'bg-foreground/90 text-background border border-foreground/90' : 'hover:bg-muted/60',
            )}
            onClick={() => onChange(k)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ======================= LOGO ======================= */
function SaltifyLogo({ size = 18 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 24 24" className="rounded-[4px]"
           style={{ background: 'var(--accent-hex)' }}>
        <path d="M6 12c0-3.314 2.686-6 6-6 1.657 0 3 1.343 3 3h3c0-3.314-2.686-6-6-6S6 5.686 6 9v3h3v-3c0-1.657 1.343-3 3-3"
              fill="rgba(0,0,0,0.28)"/>
        <path d="M18 12c0 3.314-2.686 6-6 6-1.657 0-3-1.343-3-3H6c0 3.314 2.686 6 6 6s6-2.686 6-6v-3h-3v3c0 1.657-1.343 3-3 3"
              fill="rgba(255,255,255,0.7)"/>
      </svg>
      <span className="text-sm font-semibold" style={{ color: 'var(--foreground-hex)' }}>saltify</span>
    </div>
  );
}

/* ======================= PREVIEW CONTENT (Desktop/Tablet) ======================= */
function PreviewSidebar() {
  const links = [
    { label: 'Dashboard', icon: Home, active: true },
    { label: 'Landing Pages', icon: FileText },
    { label: 'Forms', icon: FileText },
    { label: 'AI Agents', icon: Bot },
    { label: 'Contacts', icon: Users2 },
    { label: 'Data Tables', icon: Table2 },
    { label: 'Segments', icon: Users2 },
    { label: 'Reports', icon: LineChart },
  ];
  return (
    <aside
      className="h-full border-r"
      style={{
        background: 'color-mix(in oklab, var(--card-hex) 88%, black 8%)',
        borderColor: 'rgba(0,0,0,0.12)',
      }}
    >
      <div className="px-3 py-3">
        <div
          className="mb-3 flex items-center gap-2 rounded-lg px-2 py-2"
          style={{
            background: 'color-mix(in oklab, var(--accent-hex) 22%, transparent)',
            borderRadius: 'var(--radius)',
          }}
        >
          <SaltifyLogo />
        </div>
        {links.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={clsx(
              'mb-1 flex items-center gap-2 rounded-md px-2 py-[6px]',
              'text-[13px] leading-none',
              active ? 'font-semibold' : 'opacity-85',
            )}
            style={{
              background: active ? 'color-mix(in oklab, var(--accent-hex) 18%, transparent)' : undefined,
            }}
          >
            <Icon className="h-4 w-4 opacity-90" />
            {label}
          </div>
        ))}
        <div className="mt-3 border-t border-black/10 pt-3 opacity-85">
          <div className="mb-1 flex items-center gap-2 rounded-md px-2 py-[6px] text-[13px] leading-none">
            <Moon className="h-4 w-4 opacity-90" /> Dark Mode
          </div>
          <div className="mb-1 flex items-center gap-2 rounded-md px-2 py-[6px] text-[13px] leading-none">
            <Settings className="h-4 w-4 opacity-90" /> Settings
          </div>
        </div>
      </div>
    </aside>
  );
}

function PreviewTopbar() {
  return (
    <header
      className="flex items-center justify-between border-b px-4 py-2"
      style={{
        background: 'color-mix(in oklab, var(--card-hex) 80%, transparent)',
        borderColor: 'rgba(0,0,0,0.12)',
      }}
    >
      <div className="text-[13px] opacity-90">Home / Data Extensions / Create</div>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1 h-8 w-72 rounded-md border px-2 text-[12px] opacity-85"
          style={{
            background: 'var(--background-hex)',
            borderColor: 'rgba(0,0,0,0.12)',
            fontFamily: 'var(--font-family)',
          }}
        >
          <Search className="h-4 w-4 opacity-60" />
          <span>Search your asset or feature here</span>
        </div>
        <button
          className="h-8 w-8 rounded-md grid place-items-center"
          style={{ background: 'var(--accent-hex)' }}
          title="New"
        >
          <Plus className="h-4 w-4" style={{ color: 'var(--background-hex)' }} />
        </button>
        <button
          className="h-8 w-8 rounded-md grid place-items-center"
          style={{ background: 'color-mix(in oklab, var(--card-hex) 65%, transparent)' }}
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div
          className="h-8 w-8 rounded-full grid place-items-center"
          style={{ background: 'color-mix(in oklab, var(--accent-hex) 35%, transparent)' }}
          title="You"
        >
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}

function PreviewCards() {
  const items: Array<[string, string]> = [
    ['Event Invitation Data', 'Predefined attributes for common use cases.'],
    ['Lead Generation Data', 'Predefined attributes for common use cases.'],
    ['Preference Management', 'Predefined attributes for common use cases.'],
    ['Job Application Data', 'Predefined attributes for common use cases.'],
    ['Feedback Collection', 'Predefined attributes for common use cases.'],
    ['Newsletter Signup', 'Predefined attributes for common use cases.'],
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map(([t, s]) => (
        <div
          key={t}
          className="rounded-lg border p-3"
          style={{
            background: 'color-mix(in oklab, var(--card-hex) 80%, transparent)',
            borderColor: 'rgba(0,0,0,0.12)',
            borderRadius: 'var(--radius)',
            minHeight: 96,
          }}
        >
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[13px] font-medium">{t}</div>
            <div
              className="h-5 w-16 rounded-md text-[11px] grid place-items-center"
              style={{
                background: 'var(--btn-secondary-bg)',
                color: 'var(--btn-secondary-fg)',
              }}
            >
              Open
            </div>
          </div>
          <div className="text-[12px] opacity-75">{s}</div>
        </div>
      ))}
    </div>
  );
}

function SaltifyPreviewDesktop() {
  return (
    <div className="grid h-full grid-cols-[220px,1fr]" style={{ fontFamily: 'var(--font-family)' }}>
      <PreviewSidebar />
      <div className="flex min-w-0 flex-col">
        <PreviewTopbar />
        <div className="flex-1 p-4">
          <div
            className="rounded-lg border p-3"
            style={{
              background: 'var(--card-hex)',
              borderColor: 'rgba(0,0,0,0.12)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[14px] font-medium opacity-90">Pick from Template</div>
              <div className="flex gap-2">
                <button
                  className="rounded-md border px-3 py-1.5 text-[12px]"
                  style={{
                    background: 'var(--btn-secondary-bg)',
                    color: 'var(--btn-secondary-fg)',
                    borderColor: 'transparent',
                  }}
                >
                  Import
                </button>
                <button
                  className="rounded-md border px-3 py-1.5 text-[12px]"
                  style={{
                    background: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-fg)',
                    borderColor: 'transparent',
                  }}
                >
                  Create
                </button>
              </div>
            </div>
            <PreviewCards />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================= PREVIEW CONTENT (Tablet/Mobile) ======================= */
function SaltifyPreviewTablet() {
  return (
    <div className="flex h-full flex-col" style={{ fontFamily: 'var(--font-family)' }}>
      <div className="px-3 pt-3">
        <SaltifyLogo size={16} />
      </div>
      <PreviewTopbar />
      <div className="flex-1 p-3">
        <PreviewCards />
      </div>
      {/* simple bottom bar */}
      <div
        className="flex items-center justify-around border-t py-2"
        style={{ background: 'color-mix(in oklab, var(--card-hex) 80%, transparent)' }}
      >
        {[Home, FileText, Users2, Settings].map((I, i) => (
          <I key={i} className="h-4 w-4" />
        ))}
      </div>
    </div>
  );
}

function SaltifyPreviewMobile() {
  return (
    <div className="flex h-full flex-col" style={{ fontFamily: 'var(--font-family)' }}>
      {/* top nav */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ background: 'color-mix(in oklab, var(--card-hex) 80%, transparent)' }}
      >
        <SaltifyLogo size={14} />
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <Bell className="h-4 w-4" />
          <User className="h-4 w-4" />
        </div>
      </div>
      {/* content */}
      <div className="flex-1 p-3">
        <div
          className="rounded-lg border p-3"
          style={{
            background: 'var(--card-hex)',
            borderColor: 'rgba(0,0,0,0.12)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13px] font-medium opacity-90">Pick a Template</div>
            <button
              className="rounded-md border px-2 py-1 text-[12px]"
              style={{
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-fg)',
                borderColor: 'transparent',
              }}
            >
              Create
            </button>
          </div>
          {/* 2-col grid for mobile cards */}
          <div className="grid gap-2 grid-cols-2">
            {['Leads', 'Forms', 'Segments', 'Reports'].map((t) => (
              <div
                key={t}
                className="rounded-md border p-2"
                style={{
                  background: 'color-mix(in oklab, var(--card-hex) 80%, transparent)',
                  borderColor: 'rgba(0,0,0,0.12)',
                  borderRadius: 'var(--radius)',
                  minHeight: 72,
                }}
              >
                <div className="text-[12px] font-medium">{t}</div>
                <div className="text-[11px] opacity-70">Quick access</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* bottom tabs */}
      <div
        className="flex items-center justify-around border-t py-1.5"
        style={{ background: 'color-mix(in oklab, var(--card-hex) 80%, transparent)' }}
      >
        {[Home, FileText, Users2, Settings].map((I, i) => (
          <div key={i} className="grid place-items-center">
            <I className="h-4 w-4" />
            <div className="text-[10px]">Tab</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ======================= DEVICE FRAMES ======================= */
function IMacFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full">
      {/* Black bezel */}
      <div className="absolute inset-0 rounded-[26px] bg-black shadow-2xl overflow-hidden">
        <div className="relative h-[5%] min-h-[14px]">
          <div className="absolute left-1/2 top-2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-black/60 ring-2 ring-black/30" />
        </div>
        {/* Screen area */}
        <div
          className="absolute left-[1%] right-[1%] top-[6%] bottom-[18%] rounded-[18px] overflow-hidden"
          style={{ background: 'var(--background-hex)', color: 'var(--foreground-hex)' }}
        >
          {children}
        </div>
        {/* Silver chin */}
        <div
          className="absolute left-0 right-0 bottom-0 h-[18%] border-t"
          style={{
            background: 'linear-gradient(180deg, #E7EAEE 0%, #C8CDD2 70%, #B6BBC1 100%)',
            borderColor: '#9AA1A8',
          }}
        >
          <div
            className="mx-auto mt-[6%] h-5 w-5 rounded-full"
            style={{ background: 'linear-gradient(180deg, #9AA1A8 0%, #7F888F 100%)' }}
          />
        </div>
      </div>
      {/* Stand */}
      <div className="absolute left-1/2 -bottom-6 h-2 w-24 -translate-x-1/2 rounded-full bg-black/20" />
      <div
        className="absolute left-1/2 -bottom-10 h-4 w-40 -translate-x-1/2 rounded-b-[14px]"
        style={{ background: 'linear-gradient(180deg, #CDD2D8 0%, #B8BFC6 60%, #AAB1B9 100%)' }}
      />
    </div>
  );
}

function IPadFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 rounded-[28px] bg-black shadow-xl overflow-hidden">
        <div
          className="absolute inset-[1.5%] rounded-[22px] overflow-hidden"
          style={{ background: 'var(--background-hex)', color: 'var(--foreground-hex)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 rounded-[36px] bg-black shadow-xl overflow-hidden">
        {/* Dynamic island notch */}
        <div className="absolute left-1/2 top-[2.5%] h-5 w-24 -translate-x-1/2 rounded-full bg-black/50" />
        <div
          className="absolute inset-x-[3%] top-[7%] bottom-[3%] rounded-[28px] overflow-hidden"
          style={{ background: 'var(--background-hex)', color: 'var(--foreground-hex)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ======================= PREVIEW WRAPPER ======================= */
function PreviewDevice({
  device,
}: {
  device: Device;
}) {
  // sizes + aspect per device
  const cfg = device === 'desktop'
    ? { maxW: 'max-w-[640px]', aspect: '16 / 10' }
    : device === 'tablet'
    ? { maxW: 'max-w-[520px]', aspect: '4 / 3' }
    : { maxW: 'max-w-[360px]', aspect: '9 / 19.5' };

  return (
    <div className={clsx('relative mx-auto w-full', cfg.maxW)} style={{ aspectRatio: cfg.aspect }}>
      {device === 'desktop' && (
        <IMacFrame>
          <SaltifyPreviewDesktop />
        </IMacFrame>
      )}
      {device === 'tablet' && (
        <IPadFrame>
          <SaltifyPreviewTablet />
        </IPadFrame>
      )}
      {device === 'mobile' && (
        <IPhoneFrame>
          <SaltifyPreviewMobile />
        </IPhoneFrame>
      )}
    </div>
  );
}

/* ======================= CUSTOM PANEL (shown only in Custom) ======================= */
function CustomThemePanel({
  value,
  onChange,
  onApplyPreset,
  device,
  onDeviceChange,
}: {
  value: CustomTheme;
  onChange: (t: CustomTheme) => void;
  onApplyPreset: (p: Partial<CustomTheme>) => void;
  device: Device;
  onDeviceChange: (d: Device) => void;
}) {
  const set = <K extends keyof CustomTheme>(k: K, v: CustomTheme[K]) => onChange({ ...value, [k]: v });
  const padCls = value.density === 'compact' ? 'p-3' : value.density === 'spacious' ? 'p-6' : 'p-4';

  return (
    <section className="rounded-lg border p-4">
      {/* Top row: Presets + Device selector */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="text-sm font-medium">Presets</div>
          <div className="text-xs text-muted-foreground">Brand</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter((p) => p.name.startsWith('Saltify')).map(({ name, t }) => (
              <button
                key={name}
                className="rounded-full border px-3 py-1.5 text-xs hover:bg-muted/60"
                onClick={() => onApplyPreset(t)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="pt-1 text-xs text-muted-foreground">Colorways</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter((p) => !p.name.startsWith('Saltify')).map(({ name, t }) => (
              <button
                key={name}
                className="rounded-full border px-3 py-1.5 text-xs hover:bg-muted/60"
                onClick={() => onApplyPreset(t)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Preview Device</span>
          <DeviceToggle value={device} onChange={onDeviceChange} />
        </div>
      </div>

      {/* Core colors */}
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['Accent', 'accent'],
          ['Background', 'background'],
          ['Text', 'foreground'],
          ['Card', 'card'],
        ].map(([label, key]) => (
          <label key={key} className="text-sm">
            <div className="mb-1 text-muted-foreground">{label}</div>
            <input
              type="color"
              className="h-9 w-full rounded-md border bg-background px-2 py-1"
              value={(value as any)[key]}
              onChange={(e) => set(key as any, e.target.value)}
            />
          </label>
        ))}
      </div>

      {/* Buttons */}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Primary Button BG</div>
            <input
              type="color"
              className="h-9 w-full rounded-md border bg-background px-2 py-1"
              value={value.btnPrimaryBg}
              onChange={(e) => set('btnPrimaryBg', e.target.value)}
            />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Primary Button Text</div>
            <input
              type="color"
              className="h-9 w-full rounded-md border bg-background px-2 py-1"
              value={value.btnPrimaryFg}
              onChange={(e) => set('btnPrimaryFg', e.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Secondary Button BG</div>
            <input
              type="color"
              className="h-9 w-full rounded-md border bg-background px-2 py-1"
              value={value.btnSecondaryBg}
              onChange={(e) => set('btnSecondaryBg', e.target.value)}
            />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-muted-foreground">Secondary Button Text</div>
            <input
              type="color"
              className="h-9 w-full rounded-md border bg-background px-2 py-1"
              value={value.btnSecondaryFg}
              onChange={(e) => set('btnSecondaryFg', e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Shape / density / font */}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          <div className="mb-1 text-muted-foreground">Border Radius</div>
          <input
            type="range"
            min={0}
            max={24}
            value={value.radius}
            onChange={(e) => set('radius', Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-1 text-xs text-muted-foreground">{value.radius}px</div>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-muted-foreground">Density</div>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={value.density}
            onChange={(e) => set('density', e.target.value as Density)}
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-muted-foreground">Font (CSS family)</div>
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder='e.g., "Inter", system-ui, -apple-system'
            value={value.font}
            onChange={(e) => set('font', e.target.value)}
          />
        </label>
      </div>

      {/* Preview — fixed aspect & capped width */}
      <div
        className={clsx('mt-5 rounded-lg border p-2 md:p-3', padCls)}
        style={{ borderColor: 'rgba(0,0,0,0.12)' }}
      >
        <PreviewDevice device={device} />
      </div>
    </section>
  );
}

/* ======================= MAIN ======================= */
export default function AppearanceTab() {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [custom, setCustom] = useState<CustomTheme>(DEFAULTS);
  const [device, setDevice] = useState<Device>('desktop');

  // init
  useEffect(() => {
    const savedMode = (localStorage.getItem(THEME_STORAGE) as ThemeMode) || 'system';
    const savedCustom = loadCustom();
    setMode(savedMode);
    setCustom(savedCustom);
  }, []);

  // respond to mode
  useEffect(() => {
    applyThemeMode(mode);
    localStorage.setItem(THEME_STORAGE, mode);

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyThemeMode('system');
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }

    if (mode === 'auto') {
      const tick = () => applyThemeMode('auto');
      const id = window.setInterval(tick, 60 * 1000); // re-evaluate every minute
      document.addEventListener('visibilitychange', tick);
      return () => {
        clearInterval(id);
        document.removeEventListener('visibilitychange', tick);
      };
    }
  }, [mode]);

  // respond to custom changes (only when custom is active)
  useEffect(() => {
    if (mode !== 'custom') return;
    applyVars(custom);
    setDarkClassFromBg(custom.background); // auto light/dark for custom
    localStorage.setItem(CUSTOM_STORAGE, JSON.stringify(custom));
  }, [mode, custom]);

  const applyPreset = (p: Partial<CustomTheme>) => {
    setCustom((cur) => {
      const next = { ...cur, ...p };
      setDarkClassFromBg(next.background);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* THEME MODE */}
      <section className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium">Theme</h4>
          {mode === 'custom' && (
            <button
              className="rounded-md border px-2 py-1 text-xs hover:bg-muted/50"
              onClick={() => setCustom(DEFAULTS)}
            >
              Reset Custom
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeModeToggle value={mode} onChange={setMode} />
          <div className="text-xs text-muted-foreground">
            {mode === 'system' && 'Following system preference.'}
            {mode === 'auto' && 'Auto: Light 07:00–19:00, Dark otherwise.'}
            {mode === 'light' && 'Using Light theme.'}
            {mode === 'dark' && 'Using Dark theme.'}
            {mode === 'custom' && 'Customize below.'}
          </div>
        </div>
      </section>

      {/* CUSTOM OPTIONS */}
      {mode === 'custom' && (
        <CustomThemePanel
          value={custom}
          onChange={setCustom}
          onApplyPreset={applyPreset}
          device={device}
          onDeviceChange={setDevice}
        />
      )}

      {/* Non-custom preview device control (optional) */}
      {mode !== 'custom' && (
        <section className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium">Preview</h4>
            <DeviceToggle value={device} onChange={setDevice} />
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
            <PreviewDevice device={device} />
          </div>
        </section>
      )}
    </div>
  );
}
