// components/settings/tabs/SidebarModuleTab.tsx
'use client';

import React from 'react';
import clsx from 'clsx';
import { MODULES, type ModuleNode } from '@/config/modules';
import { useModuleFlags } from '@/components/hooks/useModuleFlags';

/* ───────── Tri-state Switch for GROUP (on/off/partial) ───────── */
function TriSwitch({
  state, // 'on' | 'off' | 'partial'
  onToggle, // when user clicks: if state==='on' -> false, else true
  disabled,
  className,
  label,
}: {
  state: 'on' | 'off' | 'partial';
  onToggle: (nextOn: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  // tokens
  const onColor = 'var(--toggle-on, #0EA567)';       // green
  const offColor = 'var(--toggle-off, #E53935)';     // red
  const partialColor = 'var(--toggle-partial, #F59E0B)'; // amber

  const bg =
    state === 'on' ? onColor : state === 'off' ? offColor : partialColor;
  const knobX =
    state === 'on' ? 'translate-x-[22px]' : state === 'off' ? 'translate-x-[2px]' : 'translate-x-[12px]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={state === 'on'}
      aria-label={label}
      disabled={disabled}
      onClick={() => onToggle(state !== 'on')}
      className={clsx(
        'relative inline-flex h-6 w-11 items-center justify-start rounded-full align-middle',
        'transition-colors duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00332D]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{ backgroundColor: bg, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
    >
      <span
        className={clsx(
          'pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 transform-gpu rounded-full bg-white shadow ring-0',
          knobX,
          'transition-transform duration-150 ease-out'
        )}
      />
    </button>
  );
}

/* ───────── Binary Switch for LEAVES (green ON / red OFF) ───────── */
function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const onColor = 'var(--toggle-on, #0EA567)';
  const offColor = 'var(--toggle-off, #E53935)';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 items-center justify-start rounded-full align-middle',
        'transition-colors duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00332D]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{ backgroundColor: checked ? onColor : offColor, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
    >
      <span
        className={clsx(
          'pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 transform-gpu rounded-full bg-white shadow ring-0',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
          'transition-transform duration-150 ease-out'
        )}
      />
    </button>
  );
}

/* ───────── Tab UI ───────── */
export default function SidebarModuleTab() {
  const { map, setEnabled, setEnabledMany, reset } = useModuleFlags();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="text-base font-semibold">Sidebar</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Enable/disable modules in the left navigation. Changes apply instantly.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold">Modules</h4>
          <button
            type="button"
            onClick={() => reset()}
            className="h-8 px-3 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
          >
            Reset to defaults
          </button>
        </div>

        <div className="rounded-lg border">
          {MODULES.map((node, i) => (
            <div key={node.id} className={clsx('p-4', i > 0 && 'border-t')}>
              <Row
                node={node}
                map={map}
                onToggle={setEnabled}
                onToggleMany={setEnabledMany}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ───────── Rows with tri-state parent logic and always-visible children ───────── */
function Row({
  node,
  map,
  onToggle,
  onToggleMany,
}: {
  node: ModuleNode;
  map: Record<string, boolean>;
  onToggle: (id: string, on: boolean) => void;
  onToggleMany: (
    patch:
      | Partial<typeof map>
      | ((prev: typeof map) => Partial<typeof map> | typeof map)
  ) => void;
}) {
  // Leaf
  if (node.kind === 'leaf') {
    const on = map[node.id] !== false;
    const Icon = node.icon;
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          <div>
            <div className="text-sm font-medium">{node.label}</div>
            <div className="text-xs text-muted-foreground">{node.href}</div>
          </div>
        </div>
        <Switch checked={on} onCheckedChange={(v) => onToggle(node.id, v)} label={`Toggle ${node.label}`} />
      </div>
    );
  }

  // Group
  const Icon = node.icon;

  // derive tri-state from children
  const childCount = node.children.length;
  const onCount = node.children.reduce((acc, c) => acc + (map[c.id] !== false ? 1 : 0), 0);
  const allOn = onCount === childCount && childCount > 0;
  const noneOn = onCount === 0;
  const parentState: 'on' | 'off' | 'partial' = allOn ? 'on' : noneOn ? 'off' : 'partial';

  // clicking parent: if 'on' -> turn everything OFF; if 'off'/'partial' -> turn everything ON
  const handleParentToggle = (nextOn: boolean) => {
    if (nextOn) {
      // all on (parent true + all children true)
      onToggleMany((prev) => {
        const patch: Partial<typeof prev> = { [node.id]: true };
        for (const c of node.children) patch[c.id] = true;
        return patch;
      });
    } else {
      // all off
      onToggleMany((prev) => {
        const patch: Partial<typeof prev> = { [node.id]: false };
        for (const c of node.children) patch[c.id] = false;
        return patch;
      });
    }
  };

  // child toggle → recompute parent to reflect all/none/partial
  const makeChildHandler =
    (childId: string) =>
    (v: boolean) => {
      onToggleMany((prev) => {
        // compute next child states
        const next: Partial<typeof prev> = { [childId]: v };
        // recompute "all on" after this change
        let nextOnCount = 0;
        for (const c of node.children) {
          const isThis = c.id === childId;
          const cur = prev[c.id] !== false;
          const nextVal = isThis ? v : cur;
          if (nextVal) nextOnCount++;
        }
        // set parent flag true only when all children ON; otherwise false
        next[node.id] = nextOnCount === node.children.length;
        return next;
      });
    };

  return (
    <div className="space-y-3">
      {/* Parent row (tri-state) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          <div className="text-sm font-semibold">{node.label}</div>
        </div>
        <TriSwitch
          state={parentState}
          onToggle={handleParentToggle}
          label={`Toggle ${node.label}`}
        />
      </div>

      {/* Children: always visible */}
      <div className="ml-7 space-y-2">
        {node.children.map((child) => {
          const on = map[child.id] !== false;
          const CIcon = child.icon;
          return (
            <div key={child.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div className="flex items-center gap-3">
                {CIcon ? <CIcon className="h-4 w-4" /> : null}
                <div>
                  <div className="text-sm font-medium">{child.label}</div>
                  <div className="text-xs text-muted-foreground">{child.href}</div>
                </div>
              </div>
              <Switch checked={on} onCheckedChange={makeChildHandler(child.id)} label={`Toggle ${child.label}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
