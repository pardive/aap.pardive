// config/modules.ts
import type { ComponentType } from 'react';
import {
  LayoutDashboard, // Dashboard
  Layout,          // Landing Pages
  FileText,        // Forms
  Bot,             // AI Agents
  Users,           // Contacts (group icon)
  List,            // All Contacts
  Filter,          // Segmentation & Segments
  User,            // Profiles
  Database,        // Data (parent)
  Table as TableIcon, // Data Table
  Settings2,       // Table Attributes (schema/settings)
  BarChart3,       // Reports
} from 'lucide-react';

/* ────────────────────────── Types ────────────────────────── */

export type ModuleLeaf = {
  kind: 'leaf';
  id: string;                 // stable id (don’t change once shipped)
  label: string;
  href: string;
  icon?: ComponentType<any>;
  defaultEnabled?: boolean;   // default = true
};

export type ModuleGroup = {
  kind: 'group';
  id: string;
  label: string;
  icon?: ComponentType<any>;
  href?: string;              // optional parent route
  children: ModuleLeaf[];
  defaultEnabled?: boolean;   // default = true
};

export type ModuleNode = ModuleLeaf | ModuleGroup;
export type ChildItem = ModuleLeaf; // alias used by LeftNavigationBar

/* ────────────────────── Master Registry ───────────────────── */
/** Edit this list to add/remove/reorder what appears in the left nav. */
export const MODULES: readonly ModuleNode[] = [
  {
    kind: 'leaf',
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    defaultEnabled: true,
  },
  {
    kind: 'leaf',
    id: 'landing-pages',
    label: 'Landing Pages',
    href: '/landing-pages',
    icon: Layout,
    defaultEnabled: true,
  },
  {
    kind: 'leaf',
    id: 'forms',
    label: 'Forms',
    href: '/forms',
    icon: FileText,
    defaultEnabled: true,
  },
  {
    kind: 'leaf',
    id: 'ai-agents',
    label: 'AI Agents',
    href: '/ai-agents',
    icon: Bot,
    defaultEnabled: true,
  },

  /* ---------- Contacts group ---------- */
  {
    kind: 'group',
    id: 'contacts',
    label: 'Contacts',
    icon: Users,
    href: '/contact',
    defaultEnabled: true,
    children: [
      {
        kind: 'leaf',
        id: 'all-contacts',
        label: 'All Contacts',
        href: '/contact',
        icon: List,
        defaultEnabled: true,
      },
      {
        kind: 'leaf',
        id: 'contacts-segmentation',
        label: 'Segmentation',
        href: '/contact/segmentation',
        icon: Filter,
        defaultEnabled: true,
      },
      {
        kind: 'leaf',
        id: 'contacts-profiles',
        label: 'Profiles',
        href: '/contact/profiles',
        icon: User,
        defaultEnabled: true,
      },
    ],
  },

  /* ---------- Data group (with distinct icons) ---------- */
  {
    kind: 'group',
    id: 'data',
    label: 'Data',
    icon: Database,        // parent
    href: '/data',         // tip: have /data redirect to /data-tables
    defaultEnabled: true,
    children: [
      {
        kind: 'leaf',
        id: 'data-table',
        label: 'Data Table',
        href: '/data-tables', // existing list route
        icon: TableIcon,      // distinct icon
        defaultEnabled: true,
      },
      {
        kind: 'leaf',
        id: 'table-attributes',
        label: 'Table Attributes',
        href: '/data/table-attributes', // adjust if table-specific
        icon: Settings2,                // distinct icon
        defaultEnabled: true,
      },
    ],
  },

  /* ---------- Top-level leaves (unchanged placement) ---------- */
  
  {
    kind: 'leaf',
    id: 'reports',
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    defaultEnabled: true,
  },

  // ⚠️ Settings stays hardcoded in the LeftNavigationBar footer (not toggleable)
];

/* ─────────────────────── Helpers/Utils ─────────────────────── */

export type EnabledMap = Record<string, boolean>;

const toArray = (
  nodes: readonly ModuleNode[] | ModuleNode | null | undefined
): ModuleNode[] => {
  if (Array.isArray(nodes)) return nodes.slice();
  if (nodes && typeof nodes === 'object') return [nodes];
  return [];
};

export const flattenIds = (nodes: readonly ModuleNode[]): string[] =>
  toArray(nodes).flatMap((n) =>
    n.kind === 'group' ? [n.id, ...n.children.map((c) => c.id)] : [n.id]
  );

export const computeDefaultMap = (nodes: readonly ModuleNode[]): EnabledMap => {
  const list = toArray(nodes);
  const map: EnabledMap = {};
  list.forEach((n) => {
    if (n.kind === 'group') {
      map[n.id] = n.defaultEnabled !== false;
      n.children.forEach((c) => (map[c.id] = c.defaultEnabled !== false));
    } else {
      map[n.id] = n.defaultEnabled !== false;
    }
  });
  return map;
};

/**
 * Filters modules according to `enabled` flags.
 * - Children are removed when disabled.
 * - A group is shown if the group itself is enabled OR any child is enabled
 *   (so you never lose the group when a child is individually on).
 */
export const enabledModules = (
  nodes: readonly ModuleNode[] | ModuleNode | null | undefined,
  enabled: EnabledMap
): ModuleNode[] => {
  const list = toArray(nodes);

  return list
    .map((n) => {
      if (n.kind !== 'group') return enabled[n.id] !== false ? n : null;

      const kids = n.children.filter((c) => enabled[c.id] !== false);
      const showGroup = enabled[n.id] !== false || kids.length > 0;

      return showGroup ? ({ ...n, children: kids } as ModuleGroup) : null;
    })
    .filter(Boolean) as ModuleNode[];
};
