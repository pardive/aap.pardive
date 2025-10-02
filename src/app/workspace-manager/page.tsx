// app/admin/page.tsx
'use client';

import WorkspaceManagerShell from '@/components/layout/WorkspaceManagerShell';

export default function AdminHomePage() {
  return (
    <WorkspaceManagerShell>
      {/* ---- Page content (keep it simple; shell handles layout/nav/breadcrumbs) ---- */}
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-[#00332D] dark:text-white">
          Workspace Manager
        </h1>

        <p className="text-gray-600 dark:text-gray-300">
          Configure your workspace: users, roles, integrations, environments, billing, and more.
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <a
            href="/admin/users"
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-[#1a2336] transition"
          >
            <div className="text-base font-medium text-gray-900 dark:text-gray-100">Users</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Manage members & invites</div>
          </a>

          <a
            href="/admin/roles"
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-[#1a2336] transition"
          >
            <div className="text-base font-medium text-gray-900 dark:text-gray-100">Roles</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Permissions & access</div>
          </a>

          <a
            href="/admin/integrations"
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-[#1a2336] transition"
          >
            <div className="text-base font-medium text-gray-900 dark:text-gray-100">Integrations</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Connect external services</div>
          </a>

          <a
            href="/admin/environments"
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-[#1a2336] transition"
          >
            <div className="text-base font-medium text-gray-900 dark:text-gray-100">Environments</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Keys & runtime config</div>
          </a>

          <a
            href="/admin/billing"
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-[#1a2336] transition"
          >
            <div className="text-base font-medium text-gray-900 dark:text-gray-100">Billing</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Plan & payment methods</div>
          </a>

          <a
            href="/admin/audit-logs"
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-[#1a2336] transition"
          >
            <div className="text-base font-medium text-gray-900 dark:text-gray-100">Audit Logs</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Track workspace activity</div>
          </a>
        </div>
      </div>
    </WorkspaceManagerShell>
  );
}
